/**
 * GitHub API utility library
 * Provides authenticated GitHub API access via Octokit
 */

import { Octokit } from '@octokit/rest';
import type {
  GitHubIssue,
  GitHubIssueWithComments,
  GitHubPullRequest,
  GitHubPullRequestWithReviews,
  FetchIssuesOptions,
  FetchPullRequestsOptions,
} from '@/types/github';

/**
 * Create an authenticated Octokit instance
 */
export function getGitHubClient(accessToken: string): Octokit {
  return new Octokit({
    auth: accessToken,
  });
}

/**
 * Fetch issues from a GitHub repository
 */
export async function fetchIssues(
  accessToken: string,
  owner: string,
  repo: string,
  options?: FetchIssuesOptions
): Promise<GitHubIssue[]> {
  try {
    const octokit = getGitHubClient(accessToken);

    const response = await octokit.rest.issues.listForRepo({
      owner,
      repo,
      state: options?.state || 'open',
      per_page: options?.per_page || 30,
      page: options?.page || 1,
      labels: options?.labels,
      sort: options?.sort || 'created',
      direction: options?.direction || 'desc',
    });

    // Filter out pull requests (GitHub API returns PRs as issues)
    const issues = response.data.filter((issue) => !issue.pull_request);

    return issues.map((issue) => ({
      id: issue.id,
      number: issue.number,
      title: issue.title,
      body: issue.body || null,
      state: issue.state as 'open' | 'closed',
      html_url: issue.html_url,
      user: {
        login: issue.user?.login || 'unknown',
        id: issue.user?.id || 0,
        avatar_url: issue.user?.avatar_url || '',
        html_url: issue.user?.html_url || '',
        type: issue.user?.type || 'User',
      },
      labels: issue.labels.map((label) => {
        if (typeof label === 'string') {
          return { id: 0, name: label, color: '', description: null };
        }
        return {
          id: label.id || 0,
          name: label.name || '',
          color: label.color || '',
          description: label.description || null,
        };
      }),
      assignees: issue.assignees?.map((assignee) => ({
        login: assignee.login || 'unknown',
        id: assignee.id || 0,
        avatar_url: assignee.avatar_url || '',
        html_url: assignee.html_url || '',
        type: assignee.type || 'User',
      })) || [],
      milestone: issue.milestone
        ? {
            id: issue.milestone.id,
            number: issue.milestone.number,
            title: issue.milestone.title,
            description: issue.milestone.description || null,
            state: issue.milestone.state as 'open' | 'closed',
            html_url: issue.milestone.html_url,
            due_on: issue.milestone.due_on || null,
          }
        : null,
      comments: issue.comments,
      created_at: issue.created_at,
      updated_at: issue.updated_at,
      closed_at: issue.closed_at || null,
      pull_request: issue.pull_request
        ? {
            url: issue.pull_request.url || '',
            html_url: issue.pull_request.html_url || '',
          }
        : undefined,
    }));
  } catch (error) {
    handleGitHubError(error);
    throw error;
  }
}

/**
 * Fetch a single issue with its comments
 */
export async function fetchIssue(
  accessToken: string,
  owner: string,
  repo: string,
  issueNumber: number
): Promise<GitHubIssueWithComments> {
  try {
    const octokit = getGitHubClient(accessToken);

    // Fetch issue details
    const issueResponse = await octokit.rest.issues.get({
      owner,
      repo,
      issue_number: issueNumber,
    });

    // Fetch issue comments
    const commentsResponse = await octokit.rest.issues.listComments({
      owner,
      repo,
      issue_number: issueNumber,
    });

    const issue = issueResponse.data;

    return {
      id: issue.id,
      number: issue.number,
      title: issue.title,
      body: issue.body || null,
      state: issue.state as 'open' | 'closed',
      html_url: issue.html_url,
      user: {
        login: issue.user?.login || 'unknown',
        id: issue.user?.id || 0,
        avatar_url: issue.user?.avatar_url || '',
        html_url: issue.user?.html_url || '',
        type: issue.user?.type || 'User',
      },
      labels: issue.labels.map((label) => {
        if (typeof label === 'string') {
          return { id: 0, name: label, color: '', description: null };
        }
        return {
          id: label.id || 0,
          name: label.name || '',
          color: label.color || '',
          description: label.description || null,
        };
      }),
      assignees: issue.assignees?.map((assignee) => ({
        login: assignee.login || 'unknown',
        id: assignee.id || 0,
        avatar_url: assignee.avatar_url || '',
        html_url: assignee.html_url || '',
        type: assignee.type || 'User',
      })) || [],
      milestone: issue.milestone
        ? {
            id: issue.milestone.id,
            number: issue.milestone.number,
            title: issue.milestone.title,
            description: issue.milestone.description || null,
            state: issue.milestone.state as 'open' | 'closed',
            html_url: issue.milestone.html_url,
            due_on: issue.milestone.due_on || null,
          }
        : null,
      comments: issue.comments,
      created_at: issue.created_at,
      updated_at: issue.updated_at,
      closed_at: issue.closed_at || null,
      pull_request: issue.pull_request
        ? {
            url: issue.pull_request.url || '',
            html_url: issue.pull_request.html_url || '',
          }
        : undefined,
      comments_data: commentsResponse.data.map((comment) => ({
        id: comment.id,
        user: {
          login: comment.user?.login || 'unknown',
          id: comment.user?.id || 0,
          avatar_url: comment.user?.avatar_url || '',
          html_url: comment.user?.html_url || '',
          type: comment.user?.type || 'User',
        },
        body: comment.body || '',
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        html_url: comment.html_url,
      })),
    };
  } catch (error) {
    handleGitHubError(error);
    throw error;
  }
}

/**
 * Fetch pull requests from a GitHub repository
 */
export async function fetchPullRequests(
  accessToken: string,
  owner: string,
  repo: string,
  options?: FetchPullRequestsOptions
): Promise<GitHubPullRequest[]> {
  try {
    const octokit = getGitHubClient(accessToken);

    const response = await octokit.rest.pulls.list({
      owner,
      repo,
      state: options?.state || 'open',
      per_page: options?.per_page || 30,
      page: options?.page || 1,
      sort: options?.sort || 'created',
      direction: options?.direction || 'desc',
    });

    return response.data.map((pr) => ({
      id: pr.id,
      number: pr.number,
      title: pr.title,
      body: pr.body || null,
      state: pr.state as 'open' | 'closed',
      html_url: pr.html_url,
      user: {
        login: pr.user?.login || 'unknown',
        id: pr.user?.id || 0,
        avatar_url: pr.user?.avatar_url || '',
        html_url: pr.user?.html_url || '',
        type: pr.user?.type || 'User',
      },
      labels: pr.labels.map((label) => {
        if (typeof label === 'string') {
          return { id: 0, name: label, color: '', description: null };
        }
        return {
          id: label.id || 0,
          name: label.name || '',
          color: label.color || '',
          description: label.description || null,
        };
      }),
      assignees: pr.assignees?.map((assignee) => ({
        login: assignee.login || 'unknown',
        id: assignee.id || 0,
        avatar_url: assignee.avatar_url || '',
        html_url: assignee.html_url || '',
        type: assignee.type || 'User',
      })) || [],
      milestone: pr.milestone
        ? {
            id: pr.milestone.id,
            number: pr.milestone.number,
            title: pr.milestone.title,
            description: pr.milestone.description || null,
            state: pr.milestone.state as 'open' | 'closed',
            html_url: pr.milestone.html_url,
            due_on: pr.milestone.due_on || null,
          }
        : null,
      created_at: pr.created_at,
      updated_at: pr.updated_at,
      closed_at: pr.closed_at || null,
      merged_at: pr.merged_at || null,
      draft: pr.draft || false,
      head: {
        ref: pr.head.ref,
        sha: pr.head.sha,
      },
      base: {
        ref: pr.base.ref,
        sha: pr.base.sha,
      },
      // Note: These fields require pulls.get() for full details
      // Using pulls.list() only provides basic info
      mergeable: null,
      mergeable_state: 'unknown',
      merged: false,
      comments: 0,
      review_comments: 0,
      commits: 0,
      additions: 0,
      deletions: 0,
      changed_files: 0,
    }));
  } catch (error) {
    handleGitHubError(error);
    throw error;
  }
}

/**
 * Fetch a single pull request with its reviews
 */
export async function fetchPullRequest(
  accessToken: string,
  owner: string,
  repo: string,
  prNumber: number
): Promise<GitHubPullRequestWithReviews> {
  try {
    const octokit = getGitHubClient(accessToken);

    // Fetch PR details
    const prResponse = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    });

    // Fetch PR reviews
    const reviewsResponse = await octokit.rest.pulls.listReviews({
      owner,
      repo,
      pull_number: prNumber,
    });

    const pr = prResponse.data;

    return {
      id: pr.id,
      number: pr.number,
      title: pr.title,
      body: pr.body || null,
      state: pr.state as 'open' | 'closed',
      html_url: pr.html_url,
      user: {
        login: pr.user?.login || 'unknown',
        id: pr.user?.id || 0,
        avatar_url: pr.user?.avatar_url || '',
        html_url: pr.user?.html_url || '',
        type: pr.user?.type || 'User',
      },
      labels: pr.labels.map((label) => {
        if (typeof label === 'string') {
          return { id: 0, name: label, color: '', description: null };
        }
        return {
          id: label.id || 0,
          name: label.name || '',
          color: label.color || '',
          description: label.description || null,
        };
      }),
      assignees: pr.assignees?.map((assignee) => ({
        login: assignee.login || 'unknown',
        id: assignee.id || 0,
        avatar_url: assignee.avatar_url || '',
        html_url: assignee.html_url || '',
        type: assignee.type || 'User',
      })) || [],
      milestone: pr.milestone
        ? {
            id: pr.milestone.id,
            number: pr.milestone.number,
            title: pr.milestone.title,
            description: pr.milestone.description || null,
            state: pr.milestone.state as 'open' | 'closed',
            html_url: pr.milestone.html_url,
            due_on: pr.milestone.due_on || null,
          }
        : null,
      created_at: pr.created_at,
      updated_at: pr.updated_at,
      closed_at: pr.closed_at || null,
      merged_at: pr.merged_at || null,
      draft: pr.draft || false,
      head: {
        ref: pr.head.ref,
        sha: pr.head.sha,
      },
      base: {
        ref: pr.base.ref,
        sha: pr.base.sha,
      },
      // Note: These fields require pulls.get() for full details
      // Using pulls.list() only provides basic info
      mergeable: null,
      mergeable_state: 'unknown',
      merged: false,
      comments: 0,
      review_comments: 0,
      commits: 0,
      additions: 0,
      deletions: 0,
      changed_files: 0,
      reviews: reviewsResponse.data.map((review) => ({
        id: review.id,
        user: {
          login: review.user?.login || 'unknown',
          id: review.user?.id || 0,
          avatar_url: review.user?.avatar_url || '',
          html_url: review.user?.html_url || '',
          type: review.user?.type || 'User',
        },
        body: review.body || null,
        state: review.state as 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED' | 'PENDING',
        html_url: review.html_url,
        submitted_at: review.submitted_at || new Date().toISOString(),
      })),
    };
  } catch (error) {
    handleGitHubError(error);
    throw error;
  }
}

/**
 * Refresh GitHub access token using the refresh token
 */
async function refreshGitHubToken(
  accountId: string,
  refreshToken: string
): Promise<string | null> {
  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_ID,
        client_secret: process.env.GITHUB_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error('GitHub token refresh error:', data.error_description || data.error);
      return null;
    }

    if (data.access_token) {
      const { prisma } = await import('@/lib/db');

      // Update the account with new tokens
      await prisma.account.update({
        where: { id: accountId },
        data: {
          access_token: data.access_token,
          refresh_token: data.refresh_token || refreshToken,
          expires_at: data.expires_in
            ? Math.floor(Date.now() / 1000) + data.expires_in
            : null,
        },
      });

      return data.access_token;
    }

    return null;
  } catch (error) {
    console.error('Failed to refresh GitHub token:', error);
    return null;
  }
}

/**
 * Get GitHub access token from NextAuth session or UserSettings
 * Checks OAuth Account first, then falls back to manually-added token in UserSettings
 * Automatically refreshes expired OAuth tokens if a refresh_token is available
 * Helper function for API routes
 */
export async function getGitHubAccessToken(userId: string): Promise<string | null> {
  const { prisma } = await import('@/lib/db');

  // First, check for OAuth token from GitHub login
  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider: 'github',
    },
  });

  if (account?.access_token) {
    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    const isExpired = account.expires_at && account.expires_at < now;

    if (isExpired && account.refresh_token) {
      console.log('GitHub access token expired, attempting refresh...');
      const newToken = await refreshGitHubToken(account.id, account.refresh_token);
      if (newToken) {
        return newToken;
      }
      // If refresh failed, fall through to try manual token
      console.warn('GitHub token refresh failed, falling back to manual token if available');
    } else if (!isExpired) {
      return account.access_token;
    }
  }

  // Fall back to manually-added token in UserSettings
  const userSettings = await prisma.userSettings.findUnique({
    where: {
      userId,
    },
    select: {
      githubToken: true,
    },
  });

  return userSettings?.githubToken || null;
}

/**
 * Handle GitHub API errors
 */
function handleGitHubError(error: unknown): void {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status;
    const message = (error as { message?: string }).message || 'GitHub API error';

    console.error(`GitHub API error (${status}):`, message);

    // Add more specific error handling
    if (status === 401) {
      throw new Error('GitHub authentication failed. Please reconnect your GitHub account.');
    } else if (status === 403) {
      throw new Error('GitHub API rate limit exceeded or insufficient permissions.');
    } else if (status === 404) {
      throw new Error('Repository or resource not found.');
    }
  }

  console.error('GitHub API error:', error);
}
