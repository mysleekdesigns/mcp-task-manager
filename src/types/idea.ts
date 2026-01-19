import { IdeaStatus } from '@prisma/client';

export interface Idea {
  id: string;
  title: string;
  description: string | null;
  votes: number;
  status: IdeaStatus;
  projectId: string;
  createdById: string;
  createdBy?: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateIdeaInput {
  title: string;
  description?: string;
  projectId: string;
}

export interface UpdateIdeaInput {
  title?: string;
  description?: string;
  status?: IdeaStatus;
}

export interface IdeaWithCreator extends Idea {
  createdBy: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

export type IdeaSortOption = 'votes' | 'date' | 'title';
export type IdeaSortDirection = 'asc' | 'desc';
