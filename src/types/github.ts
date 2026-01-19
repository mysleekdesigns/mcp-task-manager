/**
 * GitHub API type definitions
 * Based on Octokit REST API responses
 */

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  type: string;
}

export interface GitHubLabel {
  id: number;
  name: string;
  color: string;
  description?: string | null;
}

export interface GitHubMilestone {
  id: number;
  number: number;
  title: string;
  description?: string | null;
  state: 'open' | 'closed';
  html_url: string;
  due_on?: string | null;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body?: string | null;
  state: 'open' | 'closed';
  html_url: string;
  user: GitHubUser;
  labels: GitHubLabel[];
  assignees: GitHubUser[];
  milestone?: GitHubMilestone | null;
  comments: number;
  created_at: string;
  updated_at: string;
  closed_at?: string | null;
  pull_request?: {
    url: string;
    html_url: string;
  };
}

export interface GitHubComment {
  id: number;
  user: GitHubUser;
  body: string;
  created_at: string;
  updated_at: string;
  html_url: string;
}

export interface GitHubIssueWithComments extends GitHubIssue {
  comments_data: GitHubComment[];
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body?: string | null;
  state: 'open' | 'closed';
  html_url: string;
  user: GitHubUser;
  labels: GitHubLabel[];
  assignees: GitHubUser[];
  milestone?: GitHubMilestone | null;
  created_at: string;
  updated_at: string;
  closed_at?: string | null;
  merged_at?: string | null;
  draft: boolean;
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
    sha: string;
  };
  mergeable?: boolean | null;
  mergeable_state?: string;
  merged: boolean;
  comments: number;
  review_comments: number;
  commits: number;
  additions: number;
  deletions: number;
  changed_files: number;
}

export interface GitHubReview {
  id: number;
  user: GitHubUser;
  body?: string | null;
  state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED' | 'PENDING';
  html_url: string;
  submitted_at: string;
}

export interface GitHubPullRequestWithReviews extends GitHubPullRequest {
  reviews: GitHubReview[];
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  owner: GitHubUser;
  html_url: string;
  description?: string | null;
  private: boolean;
  default_branch: string;
}

export type GitHubIssueState = 'open' | 'closed' | 'all';
export type GitHubPRState = 'open' | 'closed' | 'all';

export interface FetchIssuesOptions {
  state?: GitHubIssueState;
  per_page?: number;
  page?: number;
  labels?: string;
  sort?: 'created' | 'updated' | 'comments';
  direction?: 'asc' | 'desc';
}

export interface FetchPullRequestsOptions {
  state?: GitHubPRState;
  per_page?: number;
  page?: number;
  sort?: 'created' | 'updated' | 'popularity' | 'long-running';
  direction?: 'asc' | 'desc';
}

export interface GitHubErrorResponse {
  message: string;
  documentation_url?: string;
  status?: number;
}

// Legacy type for backwards compatibility
export type IssueFilter = 'all' | 'open' | 'closed';
