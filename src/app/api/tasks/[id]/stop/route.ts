import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * POST /api/tasks/[id]/stop
 * Stop a task by setting all running phases to pending
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

    // VIEWER role cannot stop tasks
    if (membership.role === 'VIEWER') {
      return NextResponse.json(
        { error: 'Insufficient permissions to stop tasks' },
        { status: 403 }
      );
    }

    // Find all running phases
    const runningPhases = task.phases.filter(
      (phase) => phase.status === 'RUNNING'
    );

    if (runningPhases.length === 0) {
      return NextResponse.json(
        { error: 'No running phases to stop' },
        { status: 400 }
      );
    }

    // Update all running phases to pending
    await Promise.all(
      runningPhases.map((phase) =>
        prisma.taskPhase.update({
          where: { id: phase.id },
          data: {
            status: 'PENDING',
          },
        })
      )
    );

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
    console.error('Error stopping task:', error);
    return NextResponse.json(
      { error: 'Failed to stop task' },
      { status: 500 }
    );
  }
}
