import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma, TaskStatus, Priority } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Validation schema for creating a task
const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  branchName: z.string().optional(),
  projectId: z.string().cuid(),
  assigneeId: z.string().cuid().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  status: z.enum(['PENDING', 'PLANNING', 'IN_PROGRESS', 'AI_REVIEW', 'HUMAN_REVIEW', 'COMPLETED', 'CANCELLED']).default('PENDING'),
  tags: z.array(z.string()).default([]),
  parentId: z.string().cuid().optional(),
});

/**
 * GET /api/tasks
 * List tasks with optional filters (projectId, status, priority, assigneeId)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assigneeId = searchParams.get('assigneeId');

    // Build where clause
    const where: Prisma.TaskWhereInput = {
      project: {
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
    };

    if (projectId) {
      where.projectId = projectId;
    }

    if (status && Object.values(TaskStatus).includes(status as TaskStatus)) {
      where.status = status as TaskStatus;
    }

    if (priority && Object.values(Priority).includes(priority as Priority)) {
      where.priority = priority as Priority;
    }

    if (assigneeId) {
      where.assigneeId = assigneeId;
    }

    // Only fetch parent tasks (not subtasks) unless filtering by specific task
    where.parentId = null;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
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
        updatedAt: 'desc',
      },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks
 * Create a new task
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = createTaskSchema.parse(body);

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

    // VIEWER role cannot create tasks
    if (membership.role === 'VIEWER') {
      return NextResponse.json(
        { error: 'Insufficient permissions to create tasks' },
        { status: 403 }
      );
    }

    // If parentId is provided, verify it exists and belongs to the same project
    if (data.parentId) {
      const parentTask = await prisma.task.findUnique({
        where: { id: data.parentId },
        select: { projectId: true },
      });

      if (!parentTask) {
        return NextResponse.json(
          { error: 'Parent task not found' },
          { status: 404 }
        );
      }

      if (parentTask.projectId !== data.projectId) {
        return NextResponse.json(
          { error: 'Parent task must belong to the same project' },
          { status: 400 }
        );
      }
    }

    // If assigneeId is provided, verify they are a member of the project
    if (data.assigneeId) {
      const assigneeMembership = await prisma.projectMember.findUnique({
        where: {
          userId_projectId: {
            userId: data.assigneeId,
            projectId: data.projectId,
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

    const task = await prisma.task.create({
      data: {
        ...data,
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
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        phases: true,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    throw error;
  }
}
