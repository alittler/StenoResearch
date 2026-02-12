
export type NoteType = 'quick' | 'research' | 'raw' | 'outline' | 'image';

export interface Notebook {
  id: string;
  title: string;
  description?: string;
  color: string;
  timestamp: number;
}

export interface ProjectNote {
  id: string;
  notebookId: string;
  content: string;
  type: NoteType;
  timestamp: number;
  question?: string;
  tags?: string[];
  metadata?: {
    urls?: string[];
    version?: number;
    imageData?: string; // Base64 image data
  };
}

export type AppView = 'shelf' | 'steno' | 'research' | 'raw' | 'outlines' | 'visuals';
