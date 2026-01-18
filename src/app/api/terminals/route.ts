import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Validation schema for creating a terminal
const createTerminalSchema = z.object({
  name: z.string().min(1).max(255),
  projectId: z.string().cuid(),
  worktreeId: z.string().cuid().optional(),
});

/**
 * GET /api/terminals
 * List all terminals for a project (filter by projectId query param)
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
        { error: 'projectId query parameter is required' },
        { status: 400 }
      );
    }

    // Verify user is a member of the project
    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: session.user.id,
          projectId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const terminals = await prisma.terminal.findMany({
      where: {
        projectId,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(terminals);
  } catch (error) {
    console.error('Error fetching terminals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch terminals', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/terminals
 * Create a new terminal (name, projectId, worktreeId optional)
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = createTerminalSchema.parse(body);

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

    // VIEWER role cannot create terminals
    if (membership.role === 'VIEWER') {
      return NextResponse.json(
        { error: 'Insufficient permissions to create terminals' },
        { status: 403 }
      );
    }

    // If worktreeId is provided, verify it exists and belongs to the same project
    if (data.worktreeId) {
      const worktree = await prisma.worktree.findUnique({
        where: { id: data.worktreeId },
        select: { projectId: true },
      });

      if (!worktree) {
        return NextResponse.json(
          { error: 'Worktree not found' },
          { status: 404 }
        );
      }

      if (worktree.projectId !== data.projectId) {
        return NextResponse.json(
          { error: 'Worktree must belong to the same project' },
          { status: 400 }
        );
      }
    }

    const terminal = await prisma.terminal.create({
      data: {
        name: data.name,
        projectId: data.projectId,
        worktreeId: data.worktreeId,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(terminal, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error creating terminal:', error);
    return NextResponse.json(
      { error: 'Failed to create terminal', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
