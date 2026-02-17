
export type NoteType = 'ledger' | 'research';

export interface ProjectNote {
  id: string;
  content: string;
  timestamp: number;
  type: NoteType;
  question?: string;
  notebookId?: string;
  metadata?: {
    urls?: string[];
  };
}

export interface Notebook {
  id: string;
  title: string;
  color: string;
  createdAt: number;
}

export type AppView = 'shelf' | 'dashboard' | 'ledger' | 'research' | 'raw';
