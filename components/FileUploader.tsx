import React, { useState, useCallback } from 'react';
import { Upload, X, FileCode, FilePlus } from 'lucide-react';
import { UploadedFile } from '../types';

interface FileUploaderProps {
  files: UploadedFile[];
  onFilesSelected: (files: UploadedFile[]) => void;
  onRemoveFile: (id: string) => void;
  maxFiles?: number;
}

const FileUploader: React.FC<FileUploaderProps> = ({ 
  files, 
  onFilesSelected, 
  onRemoveFile, 
  maxFiles = 4 
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = async (fileList: File[]) => {
    const newFiles: UploadedFile[] = [];
    
    // Enforce limit
    const remainingSlots = maxFiles - files.length;
    const filesToProcess = fileList.slice(0, remainingSlots);

    for (const file of filesToProcess) {
      if (
        file.type === 'text/html' || 
        file.name.endsWith('.html') || 
        file.name.endsWith('.htm') || 
        file.type === 'text/plain'
      ) {
        const text = await file.text();
        newFiles.push({
          id: crypto.randomUUID(),
          name: file.name,
          content: text
        });
      }
    }
    
    if (newFiles.length > 0) {
      onFilesSelected(newFiles);
    }
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      processFiles(Array.from(event.target.files));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (files.length < maxFiles) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (files.length >= maxFiles) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const isLimitReached = files.length >= maxFiles;

  return (
    <div className="w-full space-y-4">
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 ease-in-out text-center
          ${isLimitReached
            ? 'border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed opacity-60' 
            : isDragging
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 scale-[1.02] shadow-xl'
                : 'border-slate-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-500 bg-white dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer'
          }
        `}
      >
        <input
          type="file"
          multiple
          accept=".html,.htm,.txt"
          onChange={handleFileChange}
          disabled={isLimitReached}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className={`flex flex-col items-center justify-center w-full h-full ${isLimitReached ? 'pointer-events-none' : 'cursor-pointer'}`}>
          <div className={`p-3 rounded-full mb-3 transition-colors ${isDragging ? 'bg-blue-100 dark:bg-blue-500/20' : 'bg-blue-50 dark:bg-blue-500/10'}`}>
            {isDragging ? (
                <FilePlus className="w-8 h-8 text-blue-500 dark:text-blue-400 animate-bounce" />
            ) : (
                <Upload className="w-8 h-8 text-blue-500 dark:text-blue-400" />
            )}
          </div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {isLimitReached ? 'File limit reached' : isDragging ? 'Drop files here...' : 'Click or Drag to upload HTML files'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Max {maxFiles} files. Supported: .html, .htm, .txt
          </p>
        </label>
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {files.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm group animate-fade-in">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded text-blue-500 dark:text-blue-400">
                  <FileCode size={18} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{file.name}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{(file.content.length / 1024).toFixed(1)} KB</span>
                </div>
              </div>
              <button
                onClick={() => onRemoveFile(file.id)}
                className="p-1 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 rounded transition-colors"
                title="Remove file"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploader;