
export type NoteType = 'ledger' | 'research';

export interface ProjectNote {
  id: string;
  content: string;
  timestamp: number;
  type: NoteType;
  // Added optional fields used by KnowledgeArchitect and other components
  title?: string;
  category?: string;
  tags?: string[];
  links?: string[];
  is_priority?: boolean;
  raw_source_id?: string;
  question?: string;
  notebookId?: string;
  metadata?: {
    urls?: string[];
    // Added fields used by Visualizer, AssetVault, and Blueprint components
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
  // Added metadata to store core concept and canvas positioning
  coreConcept?: string;
  metadata?: {
    canvasX?: number;
    canvasY?: number;
  };
}

export type AppView = 'shelf' | 'dashboard' | 'ledger' | 'research' | 'raw';
