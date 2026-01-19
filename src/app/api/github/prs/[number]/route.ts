import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { fetchPullRequest, getGitHubAccessToken } from '@/lib/github';

// Validation schema for query parameters
const prQuerySchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
});

/**
 * GET /api/github/prs/[number]
 * Fetch a single pull request with reviews from a GitHub repository
 * Query params: owner, repo
 * Path param: number (PR number)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ number: string }> }
) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params in Next.js 16
    const resolvedParams = await params;

    // Validate PR number from path
    const prNumber = parseInt(resolvedParams.number, 10);
    if (isNaN(prNumber) || prNumber < 1) {
      return NextResponse.json(
        { error: 'Invalid pull request number' },
        { status: 400 }
      );
    }

    // Validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      owner: searchParams.get('owner'),
      repo: searchParams.get('repo'),
    };

    const validatedParams = prQuerySchema.parse(queryParams);

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

    // Fetch pull request with reviews from GitHub
    const pr = await fetchPullRequest(
      accessToken,
      validatedParams.owner,
      validatedParams.repo,
      prNumber
    );

    return NextResponse.json(pr);
  } catch (error) {
    console.error('Error fetching GitHub pull request:', error);

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
          { error: 'Pull request not found', message: error.message },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to fetch pull request', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
