import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Validation schema for creating a subtask
const createSubtaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  assigneeId: z.string().cuid().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  status: z.enum(['PENDING', 'PLANNING', 'IN_PROGRESS', 'AI_REVIEW', 'HUMAN_REVIEW', 'COMPLETED', 'CANCELLED']).default('PENDING'),
  tags: z.array(z.string()).default([]),
});

/**
 * GET /api/tasks/[id]/subtasks
 * List all subtasks for a task
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: parentId } = await params;

  // Verify parent task exists and user has access
  const parentTask = await prisma.task.findUnique({
    where: { id: parentId },
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

  if (!parentTask) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  if (parentTask.project.members.length === 0) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const subtasks = await prisma.task.findMany({
    where: { parentId },
    include: {
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      phases: {
        orderBy: {
          createdAt: 'asc',
        },
      },
      _count: {
        select: {
          subtasks: true,
          logs: true,
          files: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return NextResponse.json(subtasks);
}

/**
 * POST /api/tasks/[id]/subtasks
 * Create a new subtask for a task
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: parentId } = await params;

  try {
    const body = await request.json();
    const data = createSubtaskSchema.parse(body);

    // Verify parent task exists and user has access
    const parentTask = await prisma.task.findUnique({
      where: { id: parentId },
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

    if (!parentTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const membership = parentTask.project.members[0];
    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // VIEWER role cannot create subtasks
    if (membership.role === 'VIEWER') {
      return NextResponse.json(
        { error: 'Insufficient permissions to create subtasks' },
        { status: 403 }
      );
    }

    // If assigneeId is provided, verify they are a project member
    if (data.assigneeId) {
      const assigneeMembership = await prisma.projectMember.findUnique({
        where: {
          userId_projectId: {
            userId: data.assigneeId,
            projectId: parentTask.projectId,
          },
        },
      });

      if (!assigneeMembership) {
        return NextResponse.json(
          { error: 'Assignee must be a member of the project' },
          { status: 400 }
        );
      }
    }

    const subtask = await prisma.task.create({
      data: {
        ...data,
        projectId: parentTask.projectId,
        parentId,
        assigneeId: data.assigneeId || session.user.id,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        phases: true,
        _count: {
          select: {
            subtasks: true,
            logs: true,
            files: true,
          },
        },
      },
    });

    return NextResponse.json(subtask, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    throw error;
  }
}
