import { GoogleGenAI, Type } from "@google/genai";
import { DocType, GeminiInsightResponse, FrappeQueryConfig, Message, Sender } from '../types';

const MODEL_NAME = "gemini-2.5-flash";

const getAI = (apiKey: string) => new GoogleGenAI({ apiKey });

/**
 * Helper to format conversation history and memory for the prompt
 */
const formatContext = (history: Message[], memory: string[]) => {
    let context = "";

    if (memory.length > 0) {
        context += `\nLONG TERM MEMORY (User Facts & Rules):\n${memory.map(m => `- ${m}`).join('\n')}\n`;
    }

    if (history.length > 0) {
        context += `\nSHORT TERM MEMORY (Recent Conversation):\n`;
        // Take last 6 messages to keep context relevant but not huge
        context += history.slice(-6).map(m => 
            `${m.sender === Sender.User ? 'User' : 'Assistant'}: ${m.text}`
        ).join('\n');
        context += `\n`;
    }

    return context;
};

/**
 * 1. AI Agent: Selects relevant DocTypes from a list of names
 */
export const identifyRelevantDocTypes = async (
    userQuery: string, 
    allDocTypes: string[],
    history: Message[],
    memory: string[],
    apiKey: string
): Promise<string[]> => {
    const ai = getAI(apiKey);
    
    const prompt = `
    User Query: "${userQuery}"
    
    ${formatContext(history, memory)}

    Available DocTypes:
    ${allDocTypes.join(', ')}
    
    Based on the User Query and the Context (Memory/History), identify the top 1-3 DocTypes from the list above that are most likely to contain the data needed.
    If the user refers to previous context (e.g. "Show me ITS details"), use the history to infer the DocType.
    
    Return ONLY a JSON array of strings. Example: ["Sales Invoice", "Customer"]
    If none are relevant, return [].
    `;

    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            }
        }
    });

    try {
        return JSON.parse(response.text || "[]");
    } catch (e) {
        return [];
    }
};

/**
 * 2. AI Agent: Generates a Database Query based on selected Schema
 */
export const generateFrappeQueryConfig = async (
    userQuery: string,
    schemas: DocType[],
    history: Message[],
    memory: string[],
    apiKey: string
): Promise<FrappeQueryConfig> => {
    const ai = getAI(apiKey);
    
    const schemaContext = schemas.map(dt => 
        `DocType: ${dt.name}\nFields: ${dt.fields.map(f => `${f.fieldname} (${f.fieldtype})`).join(', ')}`
    ).join('\n\n');

    const prompt = `
    Context: You are a database expert for Frappe ERP.
    User Query: "${userQuery}"
    
    ${formatContext(history, memory)}

    Schemas:
    ${schemaContext}
    
    Generate a JSON configuration to query the Frappe API (frappe.client.get_list).
    1. Select the most relevant 'doctype'.
    2. Select specific 'fields' needed to answer the question.
    3. Create 'filters' if the user specifies conditions (e.g., specific date, status). Use Long Term Memory for default preferences (e.g. if memory says "Fiscal Year 2023", filter dates accordingly).
    4. Set 'limit' to reasonable amount (max 100 for lists, 1000 for charts).
    
    IMPORTANT: Return valid JSON adhering to the schema.
    `;

    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    doctype: { type: Type.STRING },
                    fields: { type: Type.ARRAY, items: { type: Type.STRING } },
                    filters: { type: Type.OBJECT }, // Loose object for filters
                    limit: { type: Type.NUMBER }
                },
                required: ["doctype", "fields"]
            }
        }
    });

    const result = JSON.parse(response.text || "{}");
    if (!result.filters) result.filters = {};
    return result;
};

/**
 * 3. AI Agent: Analyzes Real Data (or generates Mock Data if no real data provided)
 */
export const generateInsight = async (
  userQuery: string,
  schema: DocType[],
  realData: any[] | null = null, 
  history: Message[],
  memory: string[],
  apiKey: string = process.env.API_KEY || ''
): Promise<GeminiInsightResponse> => {
  
  if (!apiKey) throw new Error("API_KEY not found");
  const ai = getAI(apiKey);

  const schemaContext = schema.map(dt => 
    `DocType: ${dt.name}\nFields: ${dt.fields.map(f => `${f.fieldname} (${f.fieldtype})`).join(', ')}`
  ).join('\n\n');

  let prompt = '';
  const commonPrompt = `
      User Query: "${userQuery}"
      
      ${formatContext(history, memory)}

      DocType Schema Used:
      ${schemaContext}
  `;

  if (realData) {
      prompt = `
      You are a data analyst.
      ${commonPrompt}
      
      ACTUAL DATABASE RESULTS (JSON):
      ${JSON.stringify(realData).slice(0, 50000)} 
      
      Analyze the actual data above to answer the user's question.
      Use the Long Term Memory to tailor the tone or focus of the answer.
      Create a visualization if appropriate based on the data provided.
      Also provide 3 follow-up questions to help the user explore this data further.
      `;
  } else {
      prompt = `
      You are a data analyst for a Demo Mode ERP.
      ${commonPrompt}
      
      The user wants to see how the system works. GENERATE REALISTIC MOCK DATA to answer the question.
      Synthesize data that looks authentic for a business context and adheres to any rules in Long Term Memory.
      Also provide 3 follow-up questions.
      `;
  }

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      systemInstruction: "You are a helpful, professional ERP assistant. Always respond in the language of the user's query.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          answer: {
            type: Type.STRING,
            description: "The natural language answer."
          },
          visualization: {
            type: Type.OBJECT,
            nullable: true,
            description: "Configuration for a chart.",
            properties: {
              type: {
                type: Type.STRING,
                enum: ["bar", "line", "pie", "area"]
              },
              title: { type: Type.STRING },
              xAxisKey: { type: Type.STRING },
              seriesKeys: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              data: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING, description: "X-axis value" },
                    values: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                           key: { type: Type.STRING, description: "Must match seriesKeys" },
                           value: { type: Type.NUMBER }
                        },
                        required: ["key", "value"]
                      }
                    }
                  },
                  required: ["category", "values"]
                }
              }
            },
            required: ["type", "title", "xAxisKey", "seriesKeys", "data"]
          },
          suggestedQuestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "3 short, contextually relevant follow-up questions."
          }
        },
        required: ["answer"]
      }
    }
  });

  const responseText = response.text;
  if (!responseText) throw new Error("No response from Gemini");

  try {
    const rawResponse = JSON.parse(responseText);
    const result: GeminiInsightResponse = {
        answer: rawResponse.answer,
        suggestedQuestions: rawResponse.suggestedQuestions || []
    };

    if (rawResponse.visualization) {
      const viz = rawResponse.visualization;
      // Transform the structured data back to flat format for Recharts
      const flatData = viz.data.map((item: any) => {
        const row: Record<string, string | number> = {
          [viz.xAxisKey]: item.category
        };
        if (item.values && Array.isArray(item.values)) {
          item.values.forEach((v: any) => {
            row[v.key] = v.value;
          });
        }
        return row;
      });

      result.visualization = {
        type: viz.type,
        title: viz.title,
        xAxisKey: viz.xAxisKey,
        seriesKeys: viz.seriesKeys,
        data: flatData
      };
    }

    return result;

  } catch (e) {
    console.error("JSON Parse Error", e);
    throw new Error("Invalid response format");
  }
};