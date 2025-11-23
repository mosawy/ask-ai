import React from 'react';
import { Message, Sender, ChartType } from '../types';
import ChartRenderer from './ChartRenderer';
import { Bot, User, Sparkles, Loader2, ArrowRight, AlertCircle, RefreshCw, Download, FileSpreadsheet, FileJson } from 'lucide-react';
import { exportVisualizationToCSV, exportVisualizationToJSON } from '../services/exportService';

interface MessageBubbleProps {
  message: Message;
  onSuggestionClick?: (question: string) => void;
  onRetry?: (query: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onSuggestionClick, onRetry }) => {
  const isUser = message.sender === Sender.User;
  const isThinking = message.isThinking;
  const isError = message.isError;

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[90%] md:max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? 'bg-blue-600 text-white' : 
            isError ? 'bg-red-100 text-red-600 border border-red-200' :
            'bg-emerald-100 text-emerald-600 border border-emerald-200'
        }`}>
          {isUser ? <User size={16} /> : isError ? <AlertCircle size={16} /> : <Bot size={16} />}
        </div>

        {/* Content Bubble */}
        <div className={`flex flex-col w-full ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`relative px-5 py-3 rounded-2xl text-sm md:text-base leading-relaxed shadow-sm transition-colors
            ${isUser 
              ? 'bg-blue-600 text-white rounded-tr-none' 
              : isError 
                ? 'bg-red-50 text-red-900 border border-red-200 rounded-tl-none'
                : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
            }
          `}>
             {isThinking ? (
               <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Sparkles size={16} className="animate-pulse text-emerald-500" />
                    <span className="italic font-medium">Analyzing request...</span>
                  </div>
                  {message.statusMessage && (
                      <div className="flex items-center gap-2 text-xs text-slate-400 border-t border-slate-100 pt-2 mt-1">
                          <Loader2 size={12} className="animate-spin" />
                          <span>{message.statusMessage}</span>
                      </div>
                  )}
               </div>
             ) : (
               <div className="whitespace-pre-wrap">{message.text}</div>
             )}

             {/* Retry Button */}
             {isError && message.originalQuery && onRetry && (
                 <button 
                    onClick={() => onRetry(message.originalQuery!)}
                    className="mt-3 flex items-center gap-2 text-xs font-semibold text-red-600 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors w-fit"
                 >
                    <RefreshCw size={12} />
                    Retry
                 </button>
             )}
          </div>

          {/* Visualization Attachment */}
          {message.visualization && !isThinking && (
             <div className="w-full max-w-2xl mt-2 animate-fade-in-up bg-white p-1 rounded-xl border border-slate-100 shadow-sm">
                <ChartRenderer config={{
                    ...message.visualization,
                    type: message.visualization.type as ChartType
                }} />
                
                {/* Chart Data Export Tools */}
                <div className="flex justify-end items-center gap-2 px-4 pb-2 mt-1">
                   <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Export Data</span>
                   <button 
                     onClick={() => exportVisualizationToCSV(message.visualization!)}
                     className="flex items-center gap-1 px-2 py-1 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs transition-colors"
                     title="Download as CSV"
                   >
                     <FileSpreadsheet size={12} className="text-emerald-600" />
                     <span>CSV</span>
                   </button>
                   <button 
                     onClick={() => exportVisualizationToJSON(message.visualization!)}
                     className="flex items-center gap-1 px-2 py-1 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs transition-colors"
                     title="Download as JSON"
                   >
                     <FileJson size={12} className="text-amber-600" />
                     <span>JSON</span>
                   </button>
                </div>
             </div>
          )}

          {/* Suggested Follow-up Questions */}
          {message.suggestedQuestions && message.suggestedQuestions.length > 0 && !isThinking && (
             <div className="mt-3 flex flex-wrap gap-2 animate-fade-in">
                {message.suggestedQuestions.map((question, idx) => (
                    <button 
                        key={idx}
                        onClick={() => onSuggestionClick && onSuggestionClick(question)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 rounded-full text-xs text-slate-600 transition-all"
                    >
                        <span>{question}</span>
                        <ArrowRight size={10} />
                    </button>
                ))}
             </div>
          )}
          
          <span className="text-xs text-slate-400 mt-1 px-1">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
