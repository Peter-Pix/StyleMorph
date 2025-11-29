import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UploadedFile, ProcessedFile, ProcessingStatus, HistoryItem, AIModel, StyleTemplate } from './types';
import FileUploader from './components/FileUploader';
import ResultViewer from './components/ResultViewer';
import TemplateGallery from './components/TemplateGallery';
import { generateGlobalCss, rewriteHtmlFile, validateCss, getOllamaModels } from './services/geminiService';
import { Loader2, Sparkles, AlertCircle, Wand2, History as HistoryIcon, Clock, Trash2, ChevronRight, X, Undo2, Redo2, Server, Sun, Moon, Keyboard } from 'lucide-react';
import JSZip from 'jszip';

const DEFAULT_TEMPLATES: StyleTemplate[] = [
  { id: 't1', name: 'Dark Mode Minimal', prompt: 'Modern dark mode with sleek typography, high contrast, slate background, and subtle blue accents.', likes: 124, isLiked: false },
  { id: 't2', name: 'Corporate Clean', prompt: 'Professional, trustworthy corporate style with navy blue header, white background, and clean sans-serif fonts.', likes: 89, isLiked: false },
  { id: 't3', name: 'Neon Cyberpunk', prompt: 'Futuristic cyberpunk aesthetic with neon pink and cyan text, black background, and glitch effects on hover.', likes: 256, isLiked: false },
  { id: 't4', name: 'Playful & Brutalist', prompt: 'Bold neo-brutalism with thick black borders, vivid pastel colors, large typography, and offset shadows.', likes: 54, isLiked: false },
];

const App: React.FC = () => {
  // Theme State
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('stylemorph_theme');
      return saved ? saved === 'dark' : true; // Default to dark
    }
    return true;
  });

  // Model State
  const [availableModels, setAvailableModels] = useState<AIModel[]>([
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'google' },
    { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', provider: 'google' }
  ]);
  const [selectedModel, setSelectedModel] = useState<AIModel>(availableModels[0]);

  // Input State
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [prompt, setPrompt] = useState('');
  
  // Template State
  const [templates, setTemplates] = useState<StyleTemplate[]>(DEFAULT_TEMPLATES);

  // Undo/Redo State
  const [inputHistory, setInputHistory] = useState<{files: UploadedFile[], prompt: string}[]>([{files: [], prompt: ''}]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isUndoing = useRef(false);
  const debounceTimer = useRef<NodeJS.Timeout>(undefined);

  // Processing State
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [statusMessage, setStatusMessage] = useState('');
  const [results, setResults] = useState<ProcessedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Persistent History State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // --- Initialization & Effects ---

  useEffect(() => {
    // Apply Theme
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('stylemorph_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    // Load History & Templates
    try {
      const savedHistory = localStorage.getItem('stylemorph_history');
      if (savedHistory) setHistory(JSON.parse(savedHistory));

      const savedTemplates = localStorage.getItem('stylemorph_templates');
      if (savedTemplates) {
         setTemplates(JSON.parse(savedTemplates));
      }
    } catch (e) {
      console.error("Failed to load local storage data", e);
    }

    // Load Ollama Models
    const fetchLocalModels = async () => {
      const localModels = await getOllamaModels();
      if (localModels.length > 0) {
        setAvailableModels(prev => {
           const existingIds = new Set(prev.map(m => m.id));
           const newModels = localModels.filter(m => !existingIds.has(m.id));
           return [...prev, ...newModels];
        });
      }
    };
    fetchLocalModels();
  }, []);

  // --- Keyboard Shortcuts ---

  const handleDownloadAll = useCallback(async () => {
    if (results.length === 0) return;
    try {
      const zip = new JSZip();
      results.forEach((file) => {
        zip.file(file.fileName, file.content);
      });
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = "stylemorph-project.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to zip files", error);
    }
  }, [results]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoing.current = true;
      const prevIndex = historyIndex - 1;
      const prevState = inputHistory[prevIndex];
      setFiles(prevState.files);
      setPrompt(prevState.prompt);
      setHistoryIndex(prevIndex);
      setTimeout(() => { isUndoing.current = false; }, 50);
    }
  }, [historyIndex, inputHistory]);

  const handleRedo = useCallback(() => {
    if (historyIndex < inputHistory.length - 1) {
      isUndoing.current = true;
      const nextIndex = historyIndex + 1;
      const nextState = inputHistory[nextIndex];
      setFiles(nextState.files);
      setPrompt(nextState.prompt);
      setHistoryIndex(nextIndex);
      setTimeout(() => { isUndoing.current = false; }, 50);
    }
  }, [historyIndex, inputHistory]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey)) {
        if (e.key === 's') {
          e.preventDefault();
          handleDownloadAll();
        } else if (e.key === 'z') {
          e.preventDefault();
          handleUndo();
        } else if (e.key === 'y') {
          e.preventDefault();
          handleRedo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDownloadAll, handleUndo, handleRedo]);

  // --- State Updates Wrappers ---

  const addToHistoryStack = useCallback((newFiles: UploadedFile[], newPrompt: string) => {
    setInputHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ files: newFiles, prompt: newPrompt });
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const handleFilesSelected = (newFiles: UploadedFile[]) => {
    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);
    setError(null);
    if (!isUndoing.current) {
        addToHistoryStack(updatedFiles, prompt);
    }
  };

  const handleRemoveFile = (id: string) => {
    const updatedFiles = files.filter((f) => f.id !== id);
    setFiles(updatedFiles);
    if (!isUndoing.current) {
        addToHistoryStack(updatedFiles, prompt);
    }
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newPrompt = e.target.value;
    setPrompt(newPrompt);
    if (!isUndoing.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            addToHistoryStack(files, newPrompt);
        }, 1000);
    }
  };

  // --- Template Handlers ---

  const updateTemplates = (newTemplates: StyleTemplate[]) => {
      setTemplates(newTemplates);
      localStorage.setItem('stylemorph_templates', JSON.stringify(newTemplates));
  };

  const handleSelectTemplate = (template: StyleTemplate) => {
    setPrompt(template.prompt);
    if (!isUndoing.current) {
        addToHistoryStack(files, template.prompt);
    }
  };

  const handleLikeTemplate = (id: string) => {
    const newTemplates = templates.map(t => {
        if (t.id === id) {
            return { ...t, isLiked: !t.isLiked, likes: t.isLiked ? t.likes - 1 : t.likes + 1 };
        }
        return t;
    });
    updateTemplates(newTemplates);
  };

  const handleDeleteTemplate = (id: string) => {
      const newTemplates = templates.filter(t => t.id !== id);
      updateTemplates(newTemplates);
  };

  const handleRenameTemplate = (id: string, newName: string) => {
      const newTemplates = templates.map(t => t.id === id ? { ...t, name: newName } : t);
      updateTemplates(newTemplates);
  };

  const handleSaveCurrentAsTemplate = (name: string) => {
      const newTemplate: StyleTemplate = {
          id: crypto.randomUUID(),
          name,
          prompt,
          likes: 0,
          isLiked: false,
          isCustom: true
      };
      updateTemplates([...templates, newTemplate]);
  };

  // --- Processing Logic ---

  const saveToHistory = (newResults: ProcessedFile[], userPrompt: string) => {
    const newItem: HistoryItem = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      prompt: userPrompt,
      results: newResults
    };
    const updatedHistory = [newItem, ...history].slice(0, 20);
    setHistory(updatedHistory);
    localStorage.setItem('stylemorph_history', JSON.stringify(updatedHistory));
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setResults(item.results);
    setPrompt(item.prompt);
    setFiles([]); 
    setStatus(ProcessingStatus.COMPLETED);
    setShowHistory(false);
    setInputHistory([{ files: [], prompt: item.prompt }]);
    setHistoryIndex(0);
  };

  const deleteHistoryItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('stylemorph_history', JSON.stringify(updatedHistory));
  };

  const reset = () => {
    setFiles([]);
    setPrompt('');
    setResults([]);
    setStatus(ProcessingStatus.IDLE);
    setError(null);
    setInputHistory([{ files: [], prompt: '' }]);
    setHistoryIndex(0);
  };

  const processFiles = async () => {
    if (files.length === 0) return;
    if (!prompt.trim()) {
      setError("Please describe how you want to restyle the website.");
      return;
    }

    try {
      setError(null);
      setStatus(ProcessingStatus.ANALYZING);
      setStatus(ProcessingStatus.GENERATING_CSS);
      setStatusMessage(`Generating theme with ${selectedModel.name}...`);
      
      const cssContent = await generateGlobalCss(files, prompt, selectedModel);
      
      const validationErrors = validateCss(cssContent);
      if (validationErrors.length > 0) {
        setStatusMessage(`CSS Validation warning: ${validationErrors[0]} Attempting to proceed...`);
      }

      const cssFile: ProcessedFile = {
        fileName: 'style.css',
        content: cssContent,
        type: 'css'
      };

      setStatus(ProcessingStatus.REWRITING_HTML);
      const processedHtmlFiles: ProcessedFile[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setStatusMessage(`Rewriting ${file.name} (${i + 1}/${files.length})...`);
        const newHtml = await rewriteHtmlFile(file, cssContent, prompt, selectedModel);
        processedHtmlFiles.push({
          fileName: file.name,
          content: newHtml,
          type: 'html'
        });
      }

      const finalResults = [cssFile, ...processedHtmlFiles];
      setResults(finalResults);
      setStatus(ProcessingStatus.COMPLETED);
      
      if (validationErrors.length > 0) {
        setError(`Processing complete, but CSS validation found issues: ${validationErrors.join(', ')}`);
      } else {
        saveToHistory(finalResults, prompt);
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during processing.");
      setStatus(ProcessingStatus.ERROR);
    }
  };

  // --- Render ---

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-blue-500/30 overflow-x-hidden transition-colors duration-200 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-gray-50 text-slate-900'}`}>
      
      {/* Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md border-b bg-white/70 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={reset}>
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-slate-500 dark:from-white dark:to-slate-400">
              StyleMorph
            </h1>
          </div>
          <div className="flex items-center space-x-3">
             <button 
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
             >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
             </button>

             <button 
              onClick={() => setShowHistory(true)}
              className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <HistoryIcon size={18} />
              <span className="hidden sm:inline">History</span>
            </button>
            
            <div className="flex items-center space-x-2 pl-4 border-l border-slate-200 dark:border-slate-800">
              <Server size={16} className="text-slate-400 hidden sm:block" />
              <select
                value={selectedModel.id}
                onChange={(e) => {
                    const model = availableModels.find(m => m.id === e.target.value);
                    if (model) setSelectedModel(model);
                }}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 max-w-[200px]"
              >
                <optgroup label="Google AI">
                  {availableModels.filter(m => m.provider === 'google').map(model => (
                    <option key={model.id} value={model.id}>{model.name}</option>
                  ))}
                </optgroup>
                {availableModels.some(m => m.provider === 'ollama') && (
                  <optgroup label="Local (Ollama)">
                    {availableModels.filter(m => m.provider === 'ollama').map(model => (
                      <option key={model.id} value={model.id}>{model.name}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* History Sidebar */}
      <div className={`fixed inset-0 z-[60] transform transition-transform duration-300 ease-in-out ${showHistory ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="absolute inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm" onClick={() => setShowHistory(false)}></div>
        <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transition-colors">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
            <h2 className="font-semibold text-lg flex items-center text-slate-800 dark:text-white">
              <HistoryIcon className="w-5 h-5 mr-2 text-blue-500" />
              Project History
            </h2>
            <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {history.length === 0 ? (
              <div className="text-center text-slate-400 dark:text-slate-500 mt-10">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No history yet.</p>
                <p className="text-xs">Generate a style to see it here.</p>
              </div>
            ) : (
              history.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => loadHistoryItem(item)}
                  className="bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/50 hover:border-blue-500/50 rounded-xl p-4 cursor-pointer group transition-all shadow-sm dark:shadow-none"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-blue-500 dark:text-blue-400 font-mono bg-blue-50 dark:bg-blue-400/10 px-2 py-1 rounded">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                    <button 
                      onClick={(e) => deleteHistoryItem(e, item.id)}
                      className="text-slate-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2 mb-2 font-medium">"{item.prompt}"</p>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-500">
                    <span>{item.results.length} files generated</span>
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        
        {status === ProcessingStatus.COMPLETED ? (
          <div className="flex flex-col h-full space-y-4">
             {error && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-lg flex items-start space-x-3 mb-2 animate-fade-in">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-700 dark:text-yellow-200">{error}</p>
                </div>
             )}
            <div className="h-[calc(100vh-16rem)] min-h-[500px]">
              <ResultViewer 
                results={results} 
                onReset={reset} 
                onDownloadAll={handleDownloadAll}
              />
            </div>
            <div className="text-center text-xs text-slate-400 dark:text-slate-600 mt-2 flex items-center justify-center space-x-4">
                <span className="flex items-center"><Keyboard size={12} className="mr-1"/> Ctrl+S to Save All</span>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-8 animate-fade-in-up">
            
            {/* Hero Section */}
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                Modernize Your Website in Seconds
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Upload your old HTML files, describe your dream design, and let AI rewrite your code with a unified, modern CSS architecture.
              </p>
            </div>

            {/* Processing State Overlay/Card */}
            {status !== ProcessingStatus.IDLE && status !== ProcessingStatus.ERROR && (
               <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center shadow-2xl">
                  <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-800 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <Sparkles className="absolute inset-0 m-auto text-blue-500 dark:text-blue-400 w-8 h-8 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Restyling in Progress</h3>
                  <p className="text-slate-600 dark:text-slate-400">{statusMessage}</p>
               </div>
            )}

            {/* Input Form */}
            {(status === ProcessingStatus.IDLE || status === ProcessingStatus.ERROR) && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl space-y-8 relative transition-colors duration-200">
                
                {/* Undo/Redo Controls */}
                <div className="absolute top-8 right-8 flex space-x-2">
                    <button 
                        onClick={handleUndo} 
                        disabled={historyIndex === 0}
                        className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo2 size={18} />
                    </button>
                    <button 
                        onClick={handleRedo}
                        disabled={historyIndex === inputHistory.length - 1} 
                        className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                        title="Redo (Ctrl+Y)"
                    >
                        <Redo2 size={18} />
                    </button>
                </div>

                {/* File Upload Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      1. Upload HTML Files
                    </label>
                    <span className="text-xs text-slate-500 dark:text-slate-500">{files.length}/4 files</span>
                  </div>
                  <FileUploader 
                    files={files} 
                    onFilesSelected={handleFilesSelected} 
                    onRemoveFile={handleRemoveFile} 
                  />
                </div>

                {/* Prompt & Template Section */}
                <div className="space-y-4">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    2. Describe Your New Design
                  </label>
                  
                  <div className="relative">
                    <textarea
                      value={prompt}
                      onChange={handlePromptChange}
                      placeholder="e.g., I want a dark mode minimal theme with a sticky sidebar, large typography, neon blue accents, and a card-based layout for the main content."
                      className="w-full h-32 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-all text-base"
                    />
                  </div>

                  <TemplateGallery 
                    templates={templates}
                    onSelectTemplate={handleSelectTemplate}
                    onDeleteTemplate={handleDeleteTemplate}
                    onLikeTemplate={handleLikeTemplate}
                    onRenameTemplate={handleRenameTemplate}
                    onSaveCurrentAsTemplate={handleSaveCurrentAsTemplate}
                    currentPrompt={prompt}
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={processFiles}
                  disabled={files.length === 0 || !prompt.trim()}
                  className={`
                    w-full py-4 px-6 rounded-xl font-semibold text-lg flex items-center justify-center space-x-2 transition-all transform
                    ${files.length > 0 && prompt.trim() 
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 hover:-translate-y-0.5' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'}
                  `}
                >
                  {status === ProcessingStatus.IDLE || status === ProcessingStatus.ERROR ? (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Generate New Style</span>
                    </>
                  ) : (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;