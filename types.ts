
export type NoteCategory = 'MANUSCRIPT' | 'CHARACTER' | 'WORLD-BUILDING' | 'RESEARCH' | 'BRAINSTORM' | 'UNCLASSIFIED';

export type NoteType = 'ledger' | 'research' | 'outline' | 'image';

export type AppView = 'shelf' | 'dashboard' | 'steno' | 'research' | 'canvas' | 'vault' | 'outlines' | 'raw';

export interface NoteLink {
  url: string;
  description: string;
}

export interface Notebook {
  id: string;
  title: string;
  color: string;
  createdAt?: number;
  isArchived?: boolean;
}

export interface ProjectNote {
  id: string;
  content: string;
  timestamp: number;
  title?: string;
  category?: NoteCategory;
  type?: NoteType;
  tags?: string[];
  links?: NoteLink[];
  is_priority?: boolean;
  raw_source_id?: string;
  question?: string;
  notebookId?: string;
  metadata?: {
    urls?: string[];
    imageData?: string;
    canvasX?: number;
    canvasY?: number;
  };
}

export type AppMode = 'ledger' | 'architect';
