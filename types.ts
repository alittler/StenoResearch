
export type NoteType = 'ledger' | 'research' | 'outline' | 'image' | 'raw';

export interface ProjectNote {
  id: string;
  content: string;
  timestamp: number;
  type: NoteType;
  question?: string;
  title?: string;
  category?: string;
  tags?: string[];
  links?: string[];
  is_priority?: boolean;
  raw_source_id?: string;
  notebookId?: string;
  metadata?: {
    urls?: string[];
    imageData?: string;
    canvasX?: number;
    canvasY?: number;
  };
}

export interface Notebook {
  id: string;
  title: string;
  color: string;
  createdAt: number;
  coreConcept?: string;
  metadata?: {
    canvasX?: number;
    canvasY?: number;
  };
}

export type AppView = 'shelf' | 'dashboard' | 'ledger' | 'research' | 'raw' | 'visualizer' | 'brief' | 'outlines';

export type AppMode = 'ledger' | 'research';
