
export type NoteType = 'ledger' | 'research' | 'outline';

export interface ProjectNote {
  id: string;
  hash?: string; // SHA-256 content signature
  content: string;
  timestamp: number;
  type: NoteType;
  question?: string;
  notebookId?: string;
  metadata?: {
    urls?: string[];
    imageData?: string;
    canvasX?: number;
    canvasY?: number;
    [key: string]: any;
  };
  // Shredded note properties from KnowledgeArchitect/shredWallOfText
  title?: string;
  category?: string;
  tags?: string[];
  links?: string[];
  is_priority?: boolean;
  raw_source_id?: string;
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
    [key: string]: any;
  };
}

export type AppView = 'shelf' | 'dashboard' | 'ledger' | 'research' | 'outlines' | 'visualizer' | 'raw';
