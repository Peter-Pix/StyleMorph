import React, { useState } from 'react';
import { StyleTemplate } from '../types';
import { Heart, Trash2, Edit2, Plus, Check, X, Search } from 'lucide-react';

interface TemplateGalleryProps {
  templates: StyleTemplate[];
  onSelectTemplate: (template: StyleTemplate) => void;
  onDeleteTemplate: (id: string) => void;
  onLikeTemplate: (id: string) => void;
  onRenameTemplate: (id: string, newName: string) => void;
  onSaveCurrentAsTemplate: (name: string) => void;
  currentPrompt: string;
}

const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  templates,
  onSelectTemplate,
  onDeleteTemplate,
  onLikeTemplate,
  onRenameTemplate,
  onSaveCurrentAsTemplate,
  currentPrompt
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [filter, setFilter] = useState('');

  const startEditing = (template: StyleTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(template.id);
    setEditName(template.name);
  };

  const saveEdit = (e: React.MouseEvent | React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (editingId && editName.trim()) {
      onRenameTemplate(editingId, editName);
      setEditingId(null);
    }
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTemplateName.trim()) {
      onSaveCurrentAsTemplate(newTemplateName);
      setNewTemplateName('');
      setIsCreating(false);
    }
  };

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(filter.toLowerCase()) || 
    t.prompt.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Style Templates
        </label>
        
        <div className="flex space-x-2">
            <div className="relative">
                <input 
                    type="text" 
                    placeholder="Search templates..." 
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 dark:text-slate-300 w-32 focus:w-48 transition-all"
                />
                <Search size={12} className="absolute left-2.5 top-2 text-slate-400" />
            </div>
            {!isCreating ? (
            <button
                onClick={() => setIsCreating(true)}
                disabled={!currentPrompt.trim()}
                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-100 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-600/30 text-xs font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Plus size={14} />
                <span>Save Current</span>
            </button>
            ) : (
            <form onSubmit={handleSaveNew} className="flex items-center space-x-2 animate-fade-in">
                <input
                type="text"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="Template Name"
                className="px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-blue-500 rounded text-slate-700 dark:text-slate-200 focus:outline-none w-32"
                autoFocus
                />
                <button type="submit" className="p-1 bg-green-500/10 text-green-600 hover:bg-green-500/20 rounded">
                <Check size={14} />
                </button>
                <button type="button" onClick={() => setIsCreating(false)} className="p-1 bg-red-500/10 text-red-600 hover:bg-red-500/20 rounded">
                <X size={14} />
                </button>
            </form>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            onClick={() => onSelectTemplate(template)}
            className="group relative flex flex-col p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 rounded-lg cursor-pointer transition-all hover:shadow-md"
          >
            <div className="flex justify-between items-start mb-2">
              {editingId === template.id ? (
                <div className="flex items-center space-x-1 flex-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full text-sm bg-slate-100 dark:bg-slate-900 border border-blue-500 rounded px-1 py-0.5 text-slate-900 dark:text-white"
                    autoFocus
                  />
                  <button onClick={saveEdit} className="text-green-500 hover:bg-green-500/10 p-0.5 rounded"><Check size={14} /></button>
                  <button onClick={cancelEdit} className="text-red-500 hover:bg-red-500/10 p-0.5 rounded"><X size={14} /></button>
                </div>
              ) : (
                <span className="font-semibold text-sm text-slate-700 dark:text-slate-200 truncate pr-2 flex-1">
                  {template.name}
                </span>
              )}
              
              <div className="flex items-center space-x-1">
                <button
                  onClick={(e) => { e.stopPropagation(); onLikeTemplate(template.id); }}
                  className={`p-1 rounded-full transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 ${template.isLiked ? 'text-pink-500' : 'text-slate-400 dark:text-slate-600'}`}
                >
                  <Heart size={14} fill={template.isLiked ? "currentColor" : "none"} />
                </button>
                {template.isCustom && editingId !== template.id && (
                  <div className="hidden group-hover:flex items-center space-x-1">
                    <button
                        onClick={(e) => startEditing(template, e)}
                        className="p-1 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded"
                    >
                        <Edit2 size={12} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDeleteTemplate(template.id); }}
                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded"
                    >
                        <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{template.prompt}</p>
          </div>
        ))}
        {filteredTemplates.length === 0 && (
            <div className="col-span-full text-center py-4 text-slate-500 text-xs italic">
                No templates found.
            </div>
        )}
      </div>
    </div>
  );
};

export default TemplateGallery;