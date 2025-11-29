import React, { useState, useMemo } from 'react';
import { ProcessedFile } from '../types';
import { Download, Code, FileText, ArrowLeft, Check, Archive, MonitorPlay } from 'lucide-react';

interface ResultViewerProps {
  results: ProcessedFile[];
  onReset: () => void;
  onDownloadAll: () => void;
}

const ResultViewer: React.FC<ResultViewerProps> = ({ results, onReset, onDownloadAll }) => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('code');

  const activeFile = results[activeTab];
  const cssFile = results.find(f => f.type === 'css');

  const handleDownloadSingle = (file: ProcessedFile) => {
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const previewContent = useMemo(() => {
    if (activeFile.type !== 'html' || !cssFile) return '';
    // Inject the generated CSS directly into the HTML for the iframe
    const styleBlock = `<style>\n${cssFile.content}\n</style>`;
    if (activeFile.content.includes('</head>')) {
        return activeFile.content.replace('</head>', `${styleBlock}</head>`);
    }
    return activeFile.content + styleBlock;
  }, [activeFile, cssFile]);

  // Reset view mode when switching files
  React.useEffect(() => {
    if (activeFile.type === 'css') {
        setViewMode('code');
    }
  }, [activeFile]);

  if (results.length === 0) return null;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xl animate-fade-in transition-colors duration-200">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-4">
            <button 
                onClick={onReset}
                className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
                <ArrowLeft size={16} />
                <span>New Project</span>
            </button>
            <div className="h-4 w-px bg-slate-300 dark:bg-slate-600"></div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                <Check className="w-5 h-5 text-green-500 dark:text-green-400 mr-2" />
                Restyle Complete
            </h2>
        </div>
        <button
          onClick={onDownloadAll}
          title="Save All (Ctrl+S)"
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all text-sm font-medium shadow-lg shadow-blue-500/20"
        >
          <Archive size={16} />
          <span>Save All (ZIP)</span>
        </button>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Sidebar File List */}
        <div className="w-64 bg-slate-50/50 dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-700 flex flex-col overflow-y-auto">
          <div className="p-3 text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider">Generated Files</div>
          {results.map((file, index) => {
            const isCss = file.type === 'css';
            const isActive = activeTab === index;
            
            return (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`flex items-center space-x-3 px-4 py-3 text-left transition-all border-l-4 ${
                  isActive
                    ? isCss 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-slate-900 dark:text-white' 
                        : 'border-orange-500 bg-orange-50 dark:bg-orange-500/10 text-slate-900 dark:text-white'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className={`${isCss ? 'text-blue-500 dark:text-blue-400' : 'text-orange-500 dark:text-orange-400'}`}>
                    {isCss ? <Code size={16} /> : <FileText size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <span className="text-sm truncate font-medium">{file.fileName}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ml-2 ${
                            isCss 
                                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300' 
                                : 'bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-300'
                        }`}>
                            {file.type.toUpperCase()}
                        </span>
                    </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900">
            {/* Tab Bar / Actions */}
            <div className="flex items-center justify-between px-6 py-3 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-4">
                   <div className="flex items-center space-x-2">
                       <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
                           activeFile.type === 'css' 
                           ? 'border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10' 
                           : 'border-orange-500/30 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10'
                       }`}>
                           {activeFile.type.toUpperCase()}
                       </span>
                       <span className="text-sm text-slate-800 dark:text-slate-200 font-bold">{activeFile.fileName}</span>
                   </div>
                   
                   {activeFile.type === 'html' && (
                       <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                           <button
                             onClick={() => setViewMode('code')}
                             className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center space-x-1 ${
                               viewMode === 'code' 
                                 ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                                 : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                             }`}
                           >
                             <Code size={12} />
                             <span>Code</span>
                           </button>
                           <button
                             onClick={() => setViewMode('preview')}
                             className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center space-x-1 ${
                               viewMode === 'preview' 
                                 ? 'bg-blue-600 text-white shadow-sm' 
                                 : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                             }`}
                           >
                             <MonitorPlay size={12} />
                             <span>Preview</span>
                           </button>
                       </div>
                   )}
                </div>
                
                <button 
                    onClick={() => handleDownloadSingle(activeFile)}
                    className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    title="Download this file"
                >
                    <Download size={16} />
                </button>
            </div>
          
          <div className="flex-1 overflow-hidden relative group">
             {viewMode === 'preview' && activeFile.type === 'html' ? (
                <div className="w-full h-full bg-white">
                    <iframe 
                        title="preview"
                        srcDoc={previewContent}
                        className="w-full h-full border-none"
                        sandbox="allow-scripts"
                    />
                </div>
             ) : (
                <div className="w-full h-full overflow-auto">
                    <pre className="p-6 text-sm font-mono text-slate-800 dark:text-slate-300 leading-relaxed tab-4">
                    <code>{activeFile.content}</code>
                    </pre>
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultViewer;