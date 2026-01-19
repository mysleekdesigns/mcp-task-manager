import { ChangelogEntry, ChangelogType } from '@prisma/client';

export type { ChangelogEntry, ChangelogType };

export interface ChangelogEntryWithTask extends ChangelogEntry {
  task: {
    id: string;
    title: string;
    status: string;
  } | null;
  project?: {
    id: string;
    name: string;
  } | null;
}

export interface ChangelogGroupedByDate {
  date: string;
  entries: ChangelogEntryWithTask[];
}

export interface ChangelogGroupedByVersion {
  version: string;
  entries: ChangelogEntryWithTask[];
}

export interface CreateChangelogEntryInput {
  title: string;
  description?: string;
  version?: string;
  type: ChangelogType;
  taskId?: string;
  projectId: string;
}

export interface UpdateChangelogEntryInput {
  title?: string;
  description?: string;
  version?: string;
  type?: ChangelogType;
}

export interface GenerateChangelogInput {
  projectId: string;
  version?: string;
  since?: Date;
}
