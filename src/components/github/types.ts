// GitHub PR and related types

export interface GitHubUser {
  login: string;
  avatar_url: string;
  html_url: string;
}

export interface GitHubLabel {
  id: number;
  name: string;
  color: string;
  description?: string;
}

export interface GitHubReview {
  id: number;
  user: GitHubUser;
  state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED' | 'PENDING';
  submitted_at?: string;
  body?: string;
}

export interface GitHubBranch {
  ref: string;
  sha: string;
  label: string;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  merged: boolean;
  draft: boolean;
  user: GitHubUser;
  assignees: GitHubUser[];
  requested_reviewers: GitHubUser[];
  labels: GitHubLabel[];
  head: GitHubBranch;
  base: GitHubBranch;
  created_at: string;
  updated_at: string;
  closed_at?: string | null;
  merged_at?: string | null;
  html_url: string;
  additions?: number;
  deletions?: number;
  changed_files?: number;
  reviews?: GitHubReview[];
  comments?: number;
}

export type PrState = 'all' | 'open' | 'closed' | 'merged';

export interface ReviewStatus {
  approved: number;
  changesRequested: number;
  commented: number;
  pending: number;
}
