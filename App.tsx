import React, { useState, useRef, useEffect } from 'react';
import { MOCK_SCHEMA, SUGGESTED_QUESTIONS } from './constants';
import { Message, Sender, DocType, FrappeConfig } from './types';
import { 
    identifyRelevantDocTypes, 
    generateFrappeQueryConfig, 
    generateInsight 
} from './services/geminiService';
import { 
    fetchAllDocTypes, 
    fetchDocTypeSchema, 
    executeFrappeQuery 
} from './services/frappeService';
import { exportChatToCSV, exportChatToJSON } from './services/exportService';
import Sidebar from './components/Sidebar';
import MessageBubble from './components/MessageBubble';
import ConnectModal from './components/ConnectModal';
import { Send, Menu, Sparkles, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  // 1. Initialize State from LocalStorage
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chat_history');
      if (saved) {
        try {
          // Revive Date objects from JSON strings
          return JSON.parse(saved).map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }));
        } catch (e) {
          console.error("Failed to parse chat history", e);
        }
      }
    }
    return [];
  });

  const [frappeConfig, setFrappeConfig] = useState<FrappeConfig | null>(() => {
    if (typeof window !== 'undefined') {
      // Check if running natively in Frappe
      // @ts-ignore
      if (window.frappe) {
         // @ts-ignore
         return { url: window.location.origin, apiKey: '', apiSecret: '', useSessionAuth: true };
      }

      const saved = localStorage.getItem('frappe_config');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
           console.error("Failed to parse config", e);
        }
      }
    }
    return null;
  });

  // Long-term Memory State
  const [longTermMemory, setLongTermMemory] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('long_term_memory');
      if (saved) {
        try {
           return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return [];
  });

  const [inputValue, setInputValue] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Frappe Connection State
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [availableDocTypes, setAvailableDocTypes] = useState<string[]>([]);
  const [activeSchema, setActiveSchema] = useState<DocType[]>(MOCK_SCHEMA);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const apiKey = process.env.API_KEY || '';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 2. Persistence Effects
  useEffect(() => {
    localStorage.setItem('chat_history', JSON.stringify(messages));
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (frappeConfig) {
      localStorage.setItem('frappe_config', JSON.stringify(frappeConfig));
    } else {
      localStorage.removeItem('frappe_config');
    }
  }, [frappeConfig]);

  useEffect(() => {
    localStorage.setItem('long_term_memory', JSON.stringify(longTermMemory));
  }, [longTermMemory]);

  // 3. Session Restoration: Fetch DocTypes if config exists but types are missing (e.g. on reload)
  useEffect(() => {
    const restoreSession = async () => {
      if (frappeConfig && availableDocTypes.length === 0) {
         try {
             const allTypes = await fetchAllDocTypes(frappeConfig);
             setAvailableDocTypes(allTypes);
             // Restore schema preview
             setActiveSchema(allTypes.map(name => ({ name, fields: [] })));
         } catch (e) {
             console.error("Failed to refresh session data", e);
         }
      }
    };
    restoreSession();
  }, [frappeConfig, availableDocTypes.length]);

  // Initial Greeting (only if history is empty)
  useEffect(() => {
    if (messages.length === 0) {
        setMessages([
            {
                id: 'init-1',
                sender: Sender.Bot,
                text: "Hello! I'm your Frappe data assistant. \n\nI am currently in 'Demo Mode'. Click 'Connect Database' in the sidebar to give me full access to your real Frappe data.",
                timestamp: new Date()
            }
        ]);
    }
  }, []);

  const handleResetSession = () => {
    if (window.confirm("Are you sure you want to clear the chat history and disconnect?")) {
      setMessages([]);
      setFrappeConfig(null);
      setAvailableDocTypes([]);
      setActiveSchema(MOCK_SCHEMA);
      setLongTermMemory([]);
      localStorage.removeItem('chat_history');
      localStorage.removeItem('frappe_config');
      localStorage.removeItem('long_term_memory');
      
      // Re-add greeting after a brief tick
      setTimeout(() => {
         setMessages([{
            id: 'init-1',
            sender: Sender.Bot,
            text: "Hello! I'm your Frappe data assistant. \n\nI am currently in 'Demo Mode'. Click 'Connect Database' in the sidebar to give me full access to your real Frappe data.",
            timestamp: new Date()
        }]);
      }, 50);
    }
  };

  const handleExportChat = (format: 'json' | 'csv') => {
      if (format === 'json') {
          exportChatToJSON(messages);
      } else {
          exportChatToCSV(messages);
      }
  };

  const handleAddMemory = (fact: string) => {
    setLongTermMemory(prev => [...prev, fact]);
  };

  const handleRemoveMemory = (index: number) => {
    setLongTermMemory(prev => prev.filter((_, i) => i !== index));
  };

  // Handle Connection
  const handleConnect = async (config: FrappeConfig) => {
      setFrappeConfig(config);
      try {
          const allTypes = await fetchAllDocTypes(config);
          setAvailableDocTypes(allTypes);
          setActiveSchema(allTypes.map(name => ({ name, fields: [] })));
          
          setMessages(prev => [...prev, {
              id: Date.now().toString(),
              sender: Sender.Bot,
              text: `Successfully connected to ${config.url}! \n\nI found ${allTypes.length} DocTypes. You can now ask me anything about your data, and I will figure out which tables to query.`,
              timestamp: new Date()
          }]);
      } catch (e: any) {
          alert(`Connection succeeded but failed to fetch DocTypes: ${e.message}`);
      }
  };

  const updateThinkingStatus = (id: string, status: string) => {
      setMessages(prev => prev.map(m => m.id === id ? { ...m, statusMessage: status } : m));
  };

  const handleSendMessage = async (textOverride?: string) => {
    const userText = textOverride || inputValue.trim();
    
    if (!userText || isProcessing) return;

    setInputValue('');
    
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: Sender.User,
      text: userText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    const thinkingId = 'thinking-' + Date.now();
    setMessages(prev => [...prev, {
        id: thinkingId,
        sender: Sender.Bot,
        text: '',
        timestamp: new Date(),
        isThinking: true,
        statusMessage: 'Initializing...'
    }]);

    // Short Term Memory: Get last 6 messages for context
    const history = messages.slice(-6);

    try {
      if (frappeConfig) {
          // --- REAL DB MODE (Agentic Workflow) ---
          
          // 1. Identify relevant DocTypes (Pass History & Memory)
          updateThinkingStatus(thinkingId, `Scanning ${availableDocTypes.length} DocTypes...`);
          const relevantDocTypes = await identifyRelevantDocTypes(userText, availableDocTypes, history, longTermMemory, apiKey);
          
          if (relevantDocTypes.length === 0) {
              // Fallback: If no doctypes found, maybe it's a general conversation.
              // But for now we throw error or let Gemini answer with no data (not implemented yet).
              // We will try to assume MOCK schema if nothing found, or just throw.
              throw new Error("I couldn't find any relevant DocTypes for your question.");
          }

          // 2. Fetch Schema for identified DocTypes
          updateThinkingStatus(thinkingId, `Loading schema for: ${relevantDocTypes.join(', ')}...`);
          const loadedSchemas: DocType[] = [];
          for (const name of relevantDocTypes) {
             try {
                const s = await fetchDocTypeSchema(frappeConfig, name);
                if (s) loadedSchemas.push(s);
             } catch (e) {
                console.warn(`Skipping ${name} due to error`, e);
             }
          }

          if (loadedSchemas.length === 0) {
             throw new Error("Failed to retrieve schema details for selected DocTypes.");
          }

          // 3. Generate Query (Pass History & Memory)
          updateThinkingStatus(thinkingId, 'Constructing database query...');
          const queryConfig = await generateFrappeQueryConfig(userText, loadedSchemas, history, longTermMemory, apiKey);
          
          // 4. Execute Query
          updateThinkingStatus(thinkingId, `Executing query on ${queryConfig.doctype}...`);
          const realData = await executeFrappeQuery(
              frappeConfig, 
              queryConfig.doctype, 
              queryConfig.fields, 
              queryConfig.filters, 
              queryConfig.limit
          );

          // 5. Generate Insight from Real Data (Pass History & Memory)
          updateThinkingStatus(thinkingId, 'Analyzing results...');
          const response = await generateInsight(userText, loadedSchemas, realData, history, longTermMemory, apiKey);
          
          setMessages(prev => prev.filter(m => m.id !== thinkingId).concat({
            id: (Date.now() + 1).toString(),
            sender: Sender.Bot,
            text: response.answer,
            visualization: response.visualization ? {
                ...response.visualization,
                type: response.visualization.type as any
            } : undefined,
            suggestedQuestions: response.suggestedQuestions,
            timestamp: new Date()
          }));

      } else {
          // --- DEMO MODE ---
          updateThinkingStatus(thinkingId, 'Generating mock analysis...');
          // In demo mode, we use MOCK_SCHEMA but still respect history and memory
          const response = await generateInsight(userText, MOCK_SCHEMA, null, history, longTermMemory, apiKey);
          
          setMessages(prev => prev.filter(m => m.id !== thinkingId).concat({
            id: (Date.now() + 1).toString(),
            sender: Sender.Bot,
            text: response.answer,
            visualization: response.visualization ? {
                ...response.visualization,
                type: response.visualization.type as any
            } : undefined,
            suggestedQuestions: response.suggestedQuestions,
            timestamp: new Date()
          }));
      }

    } catch (error: any) {
      console.error("Error generating insight:", error);
      setMessages(prev => prev.filter(m => m.id !== thinkingId).concat({
        id: (Date.now() + 1).toString(),
        sender: Sender.Bot,
        text: `I encountered an error while processing your request:\n\n${error.message || "Unknown error"}.`,
        timestamp: new Date(),
        isError: true,
        originalQuery: userText
      }));
    } finally {
      setIsProcessing(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-full bg-slate-50">
      <ConnectModal 
        isOpen={showConnectModal} 
        onClose={() => setShowConnectModal(false)} 
        onConnect={handleConnect} 
      />

      <Sidebar 
        schema={activeSchema} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        onConnectClick={() => setShowConnectModal(true)}
        isConnected={!!frappeConfig}
        onExportChat={handleExportChat}
        longTermMemory={longTermMemory}
        onAddMemory={handleAddMemory}
        onRemoveMemory={handleRemoveMemory}
      />

      <main className="flex-1 flex flex-col relative h-full w-full max-w-full overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 justify-between flex-shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-md hover:bg-slate-100 md:hidden text-slate-600"
            >
              <Menu size={20} />
            </button>
            <div className="flex flex-col">
                <h2 className="font-semibold text-slate-800">Data Assistant</h2>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${frappeConfig ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                    {frappeConfig ? 'Connected to Database' : 'Demo Mode'}
                </span>
            </div>
          </div>
          <button 
            onClick={handleResetSession}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-full transition-colors"
            title="Clear History & Disconnect"
          >
              <RefreshCw size={18} />
          </button>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-4xl mx-auto">
            {messages.map((msg) => (
              <MessageBubble 
                key={msg.id} 
                message={msg} 
                onSuggestionClick={handleSendMessage}
                onRetry={handleSendMessage}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 bg-white border-t border-slate-200 p-4">
          <div className="max-w-4xl mx-auto">
            {/* Initial Suggestions (only when no messages) */}
            {messages.length < 2 && !frappeConfig && (
              <div className="flex gap-2 overflow-x-auto pb-3 mb-2 no-scrollbar mask-linear-fade">
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(q)}
                    className="flex-shrink-0 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors whitespace-nowrap"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div className="relative flex items-end gap-2">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={frappeConfig ? "Ask about any DocType (e.g., 'Show 5 newest Leads')" : "Ask a question about the demo data..."}
                  className="w-full pl-4 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800 placeholder:text-slate-400"
                  disabled={isProcessing}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    {isProcessing ? <Sparkles size={18} className="animate-spin text-blue-500" /> : null}
                </div>
              </div>
              
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isProcessing}
                className={`
                  p-3.5 rounded-xl flex items-center justify-center transition-all
                  ${!inputValue.trim() || isProcessing 
                    ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 active:scale-95'
                  }
                `}
              >
                <Send size={20} />
              </button>
            </div>
            <div className="text-center mt-2">
               <p className="text-[10px] text-slate-400">AI can make mistakes. Please verify important data.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;