import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Validation schema for updating a feature
const updateFeatureSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  priority: z.enum(['MUST', 'SHOULD', 'COULD', 'WONT']).optional(),
  status: z.string().optional(),
  phaseId: z.string().cuid().nullable().optional(),
});

/**
 * GET /api/features/[id]
 * Get a single feature
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

    const feature = await prisma.feature.findUnique({
      where: { id },
      include: {
        phase: {
          select: {
            id: true,
            name: true,
            order: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!feature) {
      return NextResponse.json({ error: 'Feature not found' }, { status: 404 });
    }

    // Verify user is a member of the project
    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: session.user.id,
          projectId: feature.projectId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(feature);
  } catch (error) {
    console.error('Error fetching feature:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feature', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/features/[id]
 * Update a feature
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
    const data = updateFeatureSchema.parse(body);

    // Find the feature
    const existingFeature = await prisma.feature.findUnique({
      where: { id },
      select: { projectId: true },
    });

    if (!existingFeature) {
      return NextResponse.json({ error: 'Feature not found' }, { status: 404 });
    }

    // Verify user is a member of the project
    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: session.user.id,
          projectId: existingFeature.projectId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // VIEWER role cannot update features
    if (membership.role === 'VIEWER') {
      return NextResponse.json(
        { error: 'Insufficient permissions to update features' },
        { status: 403 }
      );
    }

    // If phaseId is provided and not null, verify it belongs to the same project
    if (data.phaseId) {
      const phase = await prisma.phase.findUnique({
        where: { id: data.phaseId },
        select: { projectId: true },
      });

      if (!phase) {
        return NextResponse.json(
          { error: 'Phase not found' },
          { status: 404 }
        );
      }

      if (phase.projectId !== existingFeature.projectId) {
        return NextResponse.json(
          { error: 'Phase must belong to the same project' },
          { status: 400 }
        );
      }
    }

    const feature = await prisma.feature.update({
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
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(feature);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    throw error;
  }
}

/**
 * DELETE /api/features/[id]
 * Delete a feature
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

    // Find the feature
    const existingFeature = await prisma.feature.findUnique({
      where: { id },
      select: { projectId: true },
    });

    if (!existingFeature) {
      return NextResponse.json({ error: 'Feature not found' }, { status: 404 });
    }

    // Verify user is a member of the project
    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: session.user.id,
          projectId: existingFeature.projectId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only OWNER and ADMIN can delete features
    if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete features' },
        { status: 403 }
      );
    }

    await prisma.feature.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Feature deleted successfully' });
  } catch (error) {
    console.error('Error deleting feature:', error);
    return NextResponse.json(
      { error: 'Failed to delete feature', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
