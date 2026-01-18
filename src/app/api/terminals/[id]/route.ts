import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * GET /api/terminals/[id]
 * Get terminal by ID with project and worktree relations
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const terminal = await prisma.terminal.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            targetPath: true,
          },
        },
        worktree: {
          select: {
            id: true,
            name: true,
            path: true,
            branch: true,
          },
        },
      },
    });

    if (!terminal) {
      return NextResponse.json({ error: 'Terminal not found' }, { status: 404 });
    }

    // Verify user is a member of the project
    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: session.user.id,
          projectId: terminal.projectId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(terminal);
  } catch (error) {
    console.error('Error fetching terminal:', error);
    return NextResponse.json(
      { error: 'Failed to fetch terminal', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/terminals/[id]
 * Delete terminal by ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // First get the terminal to check project membership
    const terminal = await prisma.terminal.findUnique({
      where: { id },
      select: { projectId: true },
    });

    if (!terminal) {
      return NextResponse.json({ error: 'Terminal not found' }, { status: 404 });
    }

    // Verify user is a member of the project
    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: session.user.id,
          projectId: terminal.projectId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // VIEWER role cannot delete terminals
    if (membership.role === 'VIEWER') {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete terminals' },
        { status: 403 }
      );
    }

    await prisma.terminal.delete({
      where: { id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting terminal:', error);
    return NextResponse.json(
      { error: 'Failed to delete terminal', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
