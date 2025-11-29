export interface UploadedFile {
  id: string;
  name: string;
  content: string;
}

export interface ProcessedFile {
  fileName: string;
  content: string;
  type: 'html' | 'css';
}

export enum ProcessingStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  GENERATING_CSS = 'GENERATING_CSS',
  REWRITING_HTML = 'REWRITING_HTML',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface ProcessingStep {
  label: string;
  status: 'pending' | 'loading' | 'completed' | 'error';
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  prompt: string;
  results: ProcessedFile[];
}

export interface AIModel {
  id: string;
  name: string;
  provider: 'google' | 'ollama';
}

export interface StyleTemplate {
  id: string;
  name: string;
  prompt: string;
  likes: number;
  isLiked: boolean;
  isCustom?: boolean;
}