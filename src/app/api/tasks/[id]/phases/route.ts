import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Validation schema for creating a phase
const createPhaseSchema = z.object({
  name: z.string().min(1).max(255),
  status: z.enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED']).default('PENDING'),
  model: z.string().optional(),
});

/**
 * GET /api/tasks/[id]/phases
 * List all phases for a task
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: taskId } = await params;

  // Verify task exists and user has access
  const task = await prisma.task.findUnique({
    where: { id: taskId },
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
    },
  });

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  if (task.project.members.length === 0) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const phases = await prisma.taskPhase.findMany({
    where: { taskId },
    include: {
      logs: {
        orderBy: {
          createdAt: 'asc',
        },
      },
      _count: {
        select: {
          logs: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return NextResponse.json(phases);
}

/**
 * POST /api/tasks/[id]/phases
 * Create a new phase for a task
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: taskId } = await params;

  try {
    const body = await request.json();
    const data = createPhaseSchema.parse(body);

    // Verify task exists and user has access
    const task = await prisma.task.findUnique({
      where: { id: taskId },
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
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const membership = task.project.members[0];
    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // VIEWER role cannot create phases
    if (membership.role === 'VIEWER') {
      return NextResponse.json(
        { error: 'Insufficient permissions to create phases' },
        { status: 403 }
      );
    }

    const phase = await prisma.taskPhase.create({
      data: {
        ...data,
        taskId,
      },
      include: {
        logs: true,
      },
    });

    return NextResponse.json(phase, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    throw error;
  }
}
