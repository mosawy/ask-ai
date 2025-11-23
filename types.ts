export enum Sender {
  User = 'user',
  Bot = 'bot'
}

export enum ChartType {
  Bar = 'bar',
  Line = 'line',
  Pie = 'pie',
  Area = 'area'
}

export interface VisualizationConfig {
  type: ChartType;
  title: string;
  description?: string;
  xAxisKey: string;
  seriesKeys: string[];
  data: Array<Record<string, string | number>>;
}

export interface Message {
  id: string;
  sender: Sender;
  text: string;
  timestamp: Date;
  visualization?: VisualizationConfig;
  isThinking?: boolean;
  statusMessage?: string; // For showing "Querying database..."
  suggestedQuestions?: string[];
  isError?: boolean;
  originalQuery?: string;
}

export interface DocField {
  fieldname: string;
  label: string;
  fieldtype: string;
  options?: string;
}

export interface DocType {
  name: string;
  fields: DocField[];
}

export interface FrappeConfig {
  url: string;
  apiKey: string;
  apiSecret: string;
}

export interface FrappeQueryConfig {
  doctype: string;
  fields: string[];
  filters: Record<string, any>;
  order_by?: string;
  limit?: number;
}

// Gemini API Response structure
export interface GeminiInsightResponse {
  answer: string;
  visualization?: {
    type: string;
    title: string;
    xAxisKey: string;
    seriesKeys: string[];
    data: Array<Record<string, string | number>>;
  };
  suggestedQuestions?: string[];
}