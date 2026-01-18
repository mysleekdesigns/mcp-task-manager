import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Validation schema for updating a phase
const updatePhaseSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  order: z.number().int().min(0).optional(),
  status: z.string().optional(),
});

/**
 * GET /api/phases/[id]
 * Get a single phase with features and milestones
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

    const phase = await prisma.phase.findUnique({
      where: { id },
      include: {
        features: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        milestones: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            features: true,
            milestones: true,
          },
        },
      },
    });

    if (!phase) {
      return NextResponse.json({ error: 'Phase not found' }, { status: 404 });
    }

    // Verify user is a member of the project
    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: session.user.id,
          projectId: phase.projectId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(phase);
  } catch (error) {
    console.error('Error fetching phase:', error);
    return NextResponse.json(
      { error: 'Failed to fetch phase', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/phases/[id]
 * Update a phase
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
    const data = updatePhaseSchema.parse(body);

    // Find the phase
    const existingPhase = await prisma.phase.findUnique({
      where: { id },
      select: { projectId: true },
    });

    if (!existingPhase) {
      return NextResponse.json({ error: 'Phase not found' }, { status: 404 });
    }

    // Verify user is a member of the project
    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: session.user.id,
          projectId: existingPhase.projectId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // VIEWER role cannot update phases
    if (membership.role === 'VIEWER') {
      return NextResponse.json(
        { error: 'Insufficient permissions to update phases' },
        { status: 403 }
      );
    }

    const phase = await prisma.phase.update({
      where: { id },
      data,
      include: {
        features: true,
        milestones: true,
        _count: {
          select: {
            features: true,
            milestones: true,
          },
        },
      },
    });

    return NextResponse.json(phase);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    throw error;
  }
}

/**
 * DELETE /api/phases/[id]
 * Delete a phase (cascades to milestones, features get phaseId set to null)
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

    // Find the phase
    const existingPhase = await prisma.phase.findUnique({
      where: { id },
      select: { projectId: true },
    });

    if (!existingPhase) {
      return NextResponse.json({ error: 'Phase not found' }, { status: 404 });
    }

    // Verify user is a member of the project
    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: session.user.id,
          projectId: existingPhase.projectId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only OWNER and ADMIN can delete phases
    if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete phases' },
        { status: 403 }
      );
    }

    // Delete the phase (milestones cascade, features get phaseId set to null via SetNull)
    await prisma.phase.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Phase deleted successfully' });
  } catch (error) {
    console.error('Error deleting phase:', error);
    return NextResponse.json(
      { error: 'Failed to delete phase', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
