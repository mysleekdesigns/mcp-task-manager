export type MemoryType = 'session' | 'pr_review' | 'codebase' | 'pattern' | 'gotcha';

export interface Memory {
  id: string;
  type: string;
  title: string;
  content: string;
  projectId: string;
  createdAt: Date;
}

export interface MemoryWithProject extends Memory {
  project: {
    id: string;
    name: string;
  };
}
