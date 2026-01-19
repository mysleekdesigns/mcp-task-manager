import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { fetchIssue, getGitHubAccessToken } from '@/lib/github';

// Validation schema for query parameters
const issueQuerySchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
});

/**
 * GET /api/github/issues/[number]
 * Fetch a single issue with comments from a GitHub repository
 * Query params: owner, repo
 * Path param: number (issue number)
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

    // Validate issue number from path
    const issueNumber = parseInt(resolvedParams.number, 10);
    if (isNaN(issueNumber) || issueNumber < 1) {
      return NextResponse.json(
        { error: 'Invalid issue number' },
        { status: 400 }
      );
    }

    // Validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      owner: searchParams.get('owner'),
      repo: searchParams.get('repo'),
    };

    const validatedParams = issueQuerySchema.parse(queryParams);

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

    // Fetch issue with comments from GitHub
    const issue = await fetchIssue(
      accessToken,
      validatedParams.owner,
      validatedParams.repo,
      issueNumber
    );

    return NextResponse.json(issue);
  } catch (error) {
    console.error('Error fetching GitHub issue:', error);

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
          { error: 'Issue not found', message: error.message },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to fetch issue', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
