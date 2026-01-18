import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Validation schema for updating a task
const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  branchName: z.string().optional(),
  assigneeId: z.string().cuid().optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['PENDING', 'PLANNING', 'IN_PROGRESS', 'AI_REVIEW', 'HUMAN_REVIEW', 'COMPLETED', 'CANCELLED']).optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * GET /api/tasks/[id]
 * Get a single task with phases, logs, files, and subtasks
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

  // Fetch task and verify project membership
  const task = await prisma.task.findUnique({
    where: { id },
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
        include: {
          logs: {
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      },
      logs: {
        where: {
          phaseId: null,
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
      files: {
        orderBy: {
          createdAt: 'asc',
        },
      },
      subtasks: {
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          _count: {
            select: {
              subtasks: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
      parent: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  // Verify user is a member of the project
  if (task.project.members.length === 0) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json(task);
}

/**
 * PUT /api/tasks/[id]
 * Update a task
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const data = updateTaskSchema.parse(body);

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

    // VIEWER role cannot update tasks
    if (membership.role === 'VIEWER') {
      return NextResponse.json(
        { error: 'Insufficient permissions to update tasks' },
        { status: 403 }
      );
    }

    // If assigneeId is being changed, verify new assignee is a project member
    if (data.assigneeId !== undefined && data.assigneeId !== null) {
      const assigneeMembership = await prisma.projectMember.findUnique({
        where: {
          userId_projectId: {
            userId: data.assigneeId,
            projectId: task.projectId,
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

    const updatedTask = await prisma.task.update({
      where: { id },
      data,
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
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    throw error;
  }
}

/**
 * PATCH /api/tasks/[id]
 * Partially update a task (for quick status updates)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const data = updateTaskSchema.parse(body);

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

    // VIEWER role cannot update tasks
    if (membership.role === 'VIEWER') {
      return NextResponse.json(
        { error: 'Insufficient permissions to update tasks' },
        { status: 403 }
      );
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data,
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
      },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    throw error;
  }
}

/**
 * DELETE /api/tasks/[id]
 * Delete a task
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

  // Only OWNER, ADMIN, and MEMBER can delete tasks
  if (membership.role === 'VIEWER') {
    return NextResponse.json(
      { error: 'Insufficient permissions to delete tasks' },
      { status: 403 }
    );
  }

  await prisma.task.delete({
    where: { id },
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
