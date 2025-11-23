import React, { useState } from 'react';
import { Database, Table2, LayoutDashboard, X, Plug, CheckCircle2, Download, FileJson, FileSpreadsheet, Brain, Plus, Trash2 } from 'lucide-react';
import { DocType } from '../types';

interface SidebarProps {
  schema: DocType[];
  isOpen: boolean;
  onClose: () => void;
  onConnectClick: () => void;
  isConnected: boolean;
  onExportChat: (format: 'json' | 'csv') => void;
  longTermMemory: string[];
  onAddMemory: (fact: string) => void;
  onRemoveMemory: (index: number) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  schema, 
  isOpen, 
  onClose, 
  onConnectClick, 
  isConnected,
  onExportChat,
  longTermMemory,
  onAddMemory,
  onRemoveMemory
}) => {
  const [newMemory, setNewMemory] = useState('');

  const handleAddMemory = () => {
    if (newMemory.trim()) {
      onAddMemory(newMemory.trim());
      setNewMemory('');
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Content */}
      <div className={`
        fixed top-0 left-0 bottom-0 z-50 w-72 bg-slate-900 text-slate-300 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
              <LayoutDashboard className="text-white" size={18} />
            </div>
            <h1 className="font-bold text-white text-lg tracking-tight">FrappeInsight</h1>
          </div>
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-slate-700">
          
          {/* Connection Status Card */}
          <div className="mb-6 p-3 rounded-xl bg-slate-800/50 border border-slate-700">
             <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase">Data Source</span>
                {isConnected ? (
                    <CheckCircle2 size={14} className="text-emerald-500" />
                ) : (
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                )}
             </div>
             <div className="text-sm font-medium text-white mb-3">
                {isConnected ? 'Connected to Frappe' : 'Demo Environment'}
             </div>
             {!isConnected && (
                 <button 
                    onClick={onConnectClick}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-xs font-medium transition-colors"
                 >
                    <Plug size={14} />
                    Connect Database
                 </button>
             )}
             {isConnected && (
                 <button 
                    onClick={() => window.location.reload()} // Simple disconnect
                    className="w-full text-slate-400 hover:text-white py-1 text-xs transition-colors"
                 >
                    Disconnect
                 </button>
             )}
          </div>

          {/* Long-term Memory Section */}
          <div className="mb-6">
             <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 px-2">
               <Brain size={12} />
               <span>Long-term Memory</span>
             </div>
             
             <div className="space-y-2 mb-3">
               {longTermMemory.map((fact, idx) => (
                 <div key={idx} className="group flex items-start gap-2 p-2 rounded bg-slate-800 border border-slate-700 text-xs">
                   <span className="flex-1 text-slate-300">{fact}</span>
                   <button 
                    onClick={() => onRemoveMemory(idx)}
                    className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                   >
                     <Trash2 size={12} />
                   </button>
                 </div>
               ))}
               {longTermMemory.length === 0 && (
                 <div className="text-xs text-slate-600 px-2 italic">
                   No facts saved. Add context like "Fiscal year ends in March" to help the AI.
                 </div>
               )}
             </div>

             <div className="flex gap-1">
               <input 
                 type="text" 
                 value={newMemory}
                 onChange={(e) => setNewMemory(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleAddMemory()}
                 placeholder="Add a fact..."
                 className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
               />
               <button 
                onClick={handleAddMemory}
                className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 hover:text-white transition-colors"
               >
                 <Plus size={14} />
               </button>
             </div>
          </div>

           {/* Session Actions */}
           <div className="mb-6">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 px-2">
                <Download size={12} />
                <span>Session Actions</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => onExportChat('csv')}
                  className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                  title="Export Chat as CSV"
                >
                  <FileSpreadsheet size={16} className="text-emerald-400 mb-1" />
                  <span className="text-[10px] font-medium text-slate-300">Export CSV</span>
                </button>
                <button 
                  onClick={() => onExportChat('json')}
                  className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                  title="Export Chat as JSON"
                >
                  <FileJson size={16} className="text-amber-400 mb-1" />
                  <span className="text-[10px] font-medium text-slate-300">Export JSON</span>
                </button>
              </div>
           </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4 px-2">
              <Database size={12} />
              <span>{isConnected ? 'Available DocTypes' : 'Mock Schema'}</span>
            </div>
            
            <div className="space-y-1">
              {schema.slice(0, 20).map((doc) => (
                <div key={doc.name} className="group">
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors text-left">
                    <Table2 size={16} className="text-blue-400 group-hover:text-blue-300" />
                    <span className="text-sm font-medium text-slate-300 group-hover:text-white truncate">
                        {doc.name}
                    </span>
                  </button>
                </div>
              ))}
              {schema.length > 20 && (
                  <div className="px-3 py-2 text-xs text-slate-500 italic">
                      + {schema.length - 20} more...
                  </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs text-slate-400">Gemini 2.5 Flash Active</span>
            </div>
          <div className="text-[10px] text-slate-600 mt-2">
            AI has {isConnected ? 'full' : 'limited'} access to schema.
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;