import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * POST /api/tasks/[id]/start
 * Start a task by setting the first pending phase to running
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Fetch task and verify membership
    const task = await prisma.task.findUnique({
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
        phases: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Verify user is a member of the project
    const membership = task.project.members[0];
    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // VIEWER role cannot start tasks
    if (membership.role === 'VIEWER') {
      return NextResponse.json(
        { error: 'Insufficient permissions to start tasks' },
        { status: 403 }
      );
    }

    // Find the first pending phase
    const pendingPhase = task.phases.find(
      (phase) => phase.status === 'PENDING'
    );

    if (!pendingPhase) {
      return NextResponse.json(
        { error: 'No pending phases to start' },
        { status: 400 }
      );
    }

    // Update the phase to running
    await prisma.taskPhase.update({
      where: { id: pendingPhase.id },
      data: {
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    // Update task status if needed
    if (task.status === 'PENDING' || task.status === 'PLANNING') {
      await prisma.task.update({
        where: { id },
        data: {
          status: 'IN_PROGRESS',
        },
      });
    }

    // Fetch updated task
    const updatedTask = await prisma.task.findUnique({
      where: { id },
      include: {
        phases: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Error starting task:', error);
    return NextResponse.json(
      { error: 'Failed to start task' },
      { status: 500 }
    );
  }
}
