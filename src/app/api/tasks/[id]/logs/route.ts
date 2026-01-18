import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Validation schema for creating a log entry
const createLogSchema = z.object({
  type: z.string().min(1).max(255),
  message: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
  phaseId: z.string().cuid().optional(),
});

/**
 * GET /api/tasks/[id]/logs
 * List all logs for a task (including phase logs)
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
  const { searchParams } = new URL(request.url);
  const phaseId = searchParams.get('phaseId');

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

  // Build where clause
  const where: Prisma.TaskLogWhereInput = { taskId };

  if (phaseId) {
    where.phaseId = phaseId;
  }

  const logs = await prisma.taskLog.findMany({
    where,
    include: {
      phase: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return NextResponse.json(logs);
}

/**
 * POST /api/tasks/[id]/logs
 * Create a new log entry for a task
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
    const data = createLogSchema.parse(body);

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

    // VIEWER role cannot create logs
    if (membership.role === 'VIEWER') {
      return NextResponse.json(
        { error: 'Insufficient permissions to create logs' },
        { status: 403 }
      );
    }

    // If phaseId is provided, verify it belongs to this task
    if (data.phaseId) {
      const phase = await prisma.taskPhase.findUnique({
        where: { id: data.phaseId },
        select: { taskId: true },
      });

      if (!phase) {
        return NextResponse.json(
          { error: 'Phase not found' },
          { status: 404 }
        );
      }

      if (phase.taskId !== taskId) {
        return NextResponse.json(
          { error: 'Phase does not belong to this task' },
          { status: 400 }
        );
      }
    }

    const log = await prisma.taskLog.create({
      data: {
        ...data,
        taskId,
      },
      include: {
        phase: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    throw error;
  }
}
