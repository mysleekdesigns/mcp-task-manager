import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { fetchPullRequests, getGitHubAccessToken } from '@/lib/github';
import type { GitHubPRState } from '@/types/github';

// Validation schema for query parameters
const prsQuerySchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  state: z.enum(['open', 'closed', 'all']).optional().default('open'),
  per_page: z.coerce.number().min(1).max(100).optional().default(30),
  page: z.coerce.number().min(1).optional().default(1),
  sort: z.enum(['created', 'updated', 'popularity', 'long-running']).optional().default('created'),
  direction: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * GET /api/github/prs
 * Fetch pull requests from a GitHub repository
 * Query params: owner, repo, state?, per_page?, page?, sort?, direction?
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      owner: searchParams.get('owner'),
      repo: searchParams.get('repo'),
      state: searchParams.get('state'),
      per_page: searchParams.get('per_page'),
      page: searchParams.get('page'),
      sort: searchParams.get('sort'),
      direction: searchParams.get('direction'),
    };

    const validatedParams = prsQuerySchema.parse(queryParams);

    // Get GitHub access token
    const accessToken = await getGitHubAccessToken(session.user.id);
    if (!accessToken) {
      return NextResponse.json(
        {
          error: 'GitHub account not connected',
          message: 'Please connect your GitHub account in settings to access GitHub data.'
        },
        { status: 403 }
      );
    }

    // Fetch pull requests from GitHub
    const prs = await fetchPullRequests(
      accessToken,
      validatedParams.owner,
      validatedParams.repo,
      {
        state: validatedParams.state as GitHubPRState,
        per_page: validatedParams.per_page,
        page: validatedParams.page,
        sort: validatedParams.sort,
        direction: validatedParams.direction,
      }
    );

    return NextResponse.json(prs);
  } catch (error) {
    console.error('Error fetching GitHub pull requests:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      // Handle specific GitHub errors
      if (error.message.includes('authentication failed')) {
        return NextResponse.json(
          { error: 'GitHub authentication failed', message: error.message },
          { status: 401 }
        );
      }
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'GitHub API rate limit exceeded', message: error.message },
          { status: 429 }
        );
      }
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Repository not found', message: error.message },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to fetch pull requests', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
