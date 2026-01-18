export type MoscowPriority = 'MUST' | 'SHOULD' | 'COULD' | 'WONT';

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  phaseId: string;
}

export interface Feature {
  id: string;
  title: string;
  description?: string;
  priority: MoscowPriority;
  status: string;
  phaseId?: string;
  projectId: string;
}

export interface Phase {
  id: string;
  name: string;
  description?: string;
  order: number;
  status: string;
  projectId: string;
  features: Feature[];
  milestones: Milestone[];
}
