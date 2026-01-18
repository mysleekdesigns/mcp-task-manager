import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Validation schema for updating a project
const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  targetPath: z.string().optional(),
  githubRepo: z.string().optional(),
});

/**
 * GET /api/projects/[id]
 * Get a single project with members
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

  // Verify user is a member of the project
  const membership = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId: session.user.id,
        projectId: id,
      },
    },
  });

  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
      _count: {
        select: {
          tasks: true,
          features: true,
          phases: true,
          terminals: true,
          memories: true,
          mcpConfigs: true,
          worktrees: true,
        },
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  return NextResponse.json(project);
}

/**
 * PUT /api/projects/[id]
 * Update a project (name, description, targetPath, githubRepo)
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
    const data = updateProjectSchema.parse(body);

    // Verify user is a member with appropriate permissions
    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: session.user.id,
          projectId: id,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only OWNER and ADMIN can update project
    if (membership.role === 'VIEWER' || membership.role === 'MEMBER') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const project = await prisma.project.update({
      where: { id },
      data,
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    throw error;
  }
}

/**
 * DELETE /api/projects/[id]
 * Delete a project (OWNER only)
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

  // Verify user is the OWNER
  const membership = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId: session.user.id,
        projectId: id,
      },
    },
  });

  if (!membership || membership.role !== 'OWNER') {
    return NextResponse.json(
      { error: 'Only project owner can delete the project' },
      { status: 403 }
    );
  }

  await prisma.project.delete({
    where: { id },
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
