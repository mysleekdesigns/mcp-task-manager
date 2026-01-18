import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Validation schema for updating a milestone
const updateMilestoneSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  completed: z.boolean().optional(),
});

/**
 * GET /api/milestones/[id]
 * Get a single milestone
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const milestone = await prisma.milestone.findUnique({
      where: { id },
      include: {
        phase: {
          select: {
            id: true,
            name: true,
            order: true,
            projectId: true,
          },
        },
      },
    });

    if (!milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    // Verify user is a member of the project
    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: session.user.id,
          projectId: milestone.phase.projectId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(milestone);
  } catch (error) {
    console.error('Error fetching milestone:', error);
    return NextResponse.json(
      { error: 'Failed to fetch milestone', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/milestones/[id]
 * Update a milestone
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const data = updateMilestoneSchema.parse(body);

    // Find the milestone with phase info
    const existingMilestone = await prisma.milestone.findUnique({
      where: { id },
      include: {
        phase: {
          select: {
            projectId: true,
          },
        },
      },
    });

    if (!existingMilestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    // Verify user is a member of the project
    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: session.user.id,
          projectId: existingMilestone.phase.projectId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // VIEWER role cannot update milestones
    if (membership.role === 'VIEWER') {
      return NextResponse.json(
        { error: 'Insufficient permissions to update milestones' },
        { status: 403 }
      );
    }

    const milestone = await prisma.milestone.update({
      where: { id },
      data,
      include: {
        phase: {
          select: {
            id: true,
            name: true,
            order: true,
          },
        },
      },
    });

    return NextResponse.json(milestone);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    throw error;
  }
}

/**
 * DELETE /api/milestones/[id]
 * Delete a milestone
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Find the milestone with phase info
    const existingMilestone = await prisma.milestone.findUnique({
      where: { id },
      include: {
        phase: {
          select: {
            projectId: true,
          },
        },
      },
    });

    if (!existingMilestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    // Verify user is a member of the project
    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: session.user.id,
          projectId: existingMilestone.phase.projectId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only OWNER and ADMIN can delete milestones
    if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete milestones' },
        { status: 403 }
      );
    }

    await prisma.milestone.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Milestone deleted successfully' });
  } catch (error) {
    console.error('Error deleting milestone:', error);
    return NextResponse.json(
      { error: 'Failed to delete milestone', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
