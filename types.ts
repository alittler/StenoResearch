
export type NoteType = 'ledger' | 'research' | 'outline' | 'raw';

export interface ProjectNote {
  id: string;
  content: string;
  timestamp: number;
  type: NoteType;
  question?: string;
  notebookId?: string;
  title?: string;
  category?: string;
  tags?: string[];
  links?: string[];
  is_priority?: boolean;
  raw_source_id?: string;
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

export type AppView = 'ledger' | 'research' | 'raw' | 'shelf' | 'architect';
