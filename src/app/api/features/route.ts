import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { MoscowPriority } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Validation schema for creating a feature
const createFeatureSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  priority: z.enum(['MUST', 'SHOULD', 'COULD', 'WONT']),
  status: z.string().default('planned'),
  projectId: z.string().cuid(),
  phaseId: z.string().cuid().optional(),
});

/**
 * GET /api/features
 * List features with filters (projectId required, phaseId optional)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const phaseId = searchParams.get('phaseId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId query parameter is required' },
        { status: 400 }
      );
    }

    // Verify user is a member of the project
    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: session.user.id,
          projectId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const where: { projectId: string; phaseId?: string | null } = {
      projectId,
    };

    if (phaseId) {
      where.phaseId = phaseId;
    }

    const features = await prisma.feature.findMany({
      where,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(features);
  } catch (error) {
    console.error('Error fetching features:', error);
    return NextResponse.json(
      { error: 'Failed to fetch features', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/features
 * Create a new feature
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = createFeatureSchema.parse(body);

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

    // VIEWER role cannot create features
    if (membership.role === 'VIEWER') {
      return NextResponse.json(
        { error: 'Insufficient permissions to create features' },
        { status: 403 }
      );
    }

    // If phaseId is provided, verify it belongs to the same project
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

      if (phase.projectId !== data.projectId) {
        return NextResponse.json(
          { error: 'Phase must belong to the same project' },
          { status: 400 }
        );
      }
    }

    const feature = await prisma.feature.create({
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

    return NextResponse.json(feature, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    throw error;
  }
}
