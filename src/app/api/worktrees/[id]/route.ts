import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { removeWorktree } from '@/lib/git';

/**
 * GET /api/worktrees/[id]
 * Get a single worktree by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Fetch worktree and verify project membership
    const worktree = await prisma.worktree.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            members: {
              where: {
                userId: session.user.id,
              },
            },
          },
        },
        terminals: {
          select: {
            id: true,
            name: true,
            status: true,
            pid: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        _count: {
          select: {
            terminals: true,
          },
        },
      },
    });

    if (!worktree) {
      return NextResponse.json({ error: 'Worktree not found' }, { status: 404 });
    }

    // Verify user is a member of the project
    if (worktree.project.members.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(worktree);
  } catch (error) {
    console.error('Failed to fetch worktree:', error);
    return NextResponse.json(
      { error: 'Failed to fetch worktree', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/worktrees/[id]
 * Delete a worktree (and attempt to remove from git)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const worktree = await prisma.worktree.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            members: {
              where: { userId: session.user.id },
            },
          },
          select: {
            targetPath: true,
            members: {
              where: { userId: session.user.id },
            },
          },
        },
        terminals: true,
      },
    });

    if (!worktree) {
      return NextResponse.json({ error: 'Worktree not found' }, { status: 404 });
    }

    // Verify user has access to this project
    const membership = worktree.project.members[0];
    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only OWNER, ADMIN, and MEMBER can delete worktrees
    if (membership.role === 'VIEWER') {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete worktrees' },
        { status: 403 }
      );
    }

    // Prevent deletion of main worktree
    if (worktree.isMain) {
      return NextResponse.json(
        { error: 'Cannot delete main worktree' },
        { status: 400 }
      );
    }

    // Check if there are active terminals
    if (worktree.terminals.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete worktree with active terminals' },
        { status: 400 }
      );
    }

    // Try to remove git worktree (optional, might fail)
    if (worktree.project.targetPath) {
      try {
        await removeWorktree(worktree.project.targetPath, worktree.path, true);
      } catch (gitError) {
        console.warn('Failed to remove git worktree:', gitError);
        // Continue with database deletion even if git operation fails
      }
    }

    // Delete worktree from database
    await prisma.worktree.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete worktree:', error);
    return NextResponse.json(
      { error: 'Failed to delete worktree', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
