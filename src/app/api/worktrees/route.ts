import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createWorktree } from '@/lib/git';

// Validation schema for creating a worktree
const createWorktreeSchema = z.object({
  name: z.string().min(1).max(255),
  path: z.string().min(1),
  branch: z.string().min(1),
  projectId: z.string().cuid(),
  isMain: z.boolean().default(false),
});

/**
 * GET /api/worktrees
 * List all worktrees for a project
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Verify user has access to this project
    const projectMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: session.user.id,
          projectId,
        },
      },
    });

    if (!projectMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const worktrees = await prisma.worktree.findMany({
      where: { projectId },
      include: {
        _count: {
          select: {
            terminals: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(worktrees);
  } catch (error) {
    console.error('Failed to fetch worktrees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch worktrees', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/worktrees
 * Create a new worktree
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = createWorktreeSchema.parse(body);

    // Verify user is a member of the project
    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: session.user.id,
          projectId: data.projectId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // VIEWER role cannot create worktrees
    if (membership.role === 'VIEWER') {
      return NextResponse.json(
        { error: 'Insufficient permissions to create worktrees' },
        { status: 403 }
      );
    }

    // Get project to access targetPath
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
      select: { targetPath: true },
    });

    if (!project?.targetPath) {
      return NextResponse.json(
        { error: 'Project target path is not configured' },
        { status: 400 }
      );
    }

    // If this is marked as main, unmark any existing main worktree
    if (data.isMain) {
      await prisma.worktree.updateMany({
        where: {
          projectId: data.projectId,
          isMain: true,
        },
        data: {
          isMain: false,
        },
      });
    }

    // Create worktree in database first
    const worktree = await prisma.worktree.create({
      data,
      include: {
        _count: {
          select: {
            terminals: true,
          },
        },
      },
    });

    // Try to create git worktree (optional, might fail if not a git repo)
    try {
      await createWorktree(project.targetPath, data.path, data.branch);
    } catch (gitError) {
      console.warn('Failed to create git worktree:', gitError);
      // Don't fail the request if git operation fails
      // The database record is still useful for tracking
    }

    return NextResponse.json(worktree, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Failed to create worktree:', error);
    return NextResponse.json(
      { error: 'Failed to create worktree', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
