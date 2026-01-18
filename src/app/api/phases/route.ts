import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Validation schema for creating a phase
const createPhaseSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  projectId: z.string().cuid(),
});

/**
 * GET /api/phases
 * List all phases for a project (filter by projectId query param)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

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

    const phases = await prisma.phase.findMany({
      where: {
        projectId,
      },
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
        _count: {
          select: {
            features: true,
            milestones: true,
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });

    return NextResponse.json(phases);
  } catch (error) {
    console.error('Error fetching phases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch phases', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/phases
 * Create a new phase
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = createPhaseSchema.parse(body);

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

    // VIEWER role cannot create phases
    if (membership.role === 'VIEWER') {
      return NextResponse.json(
        { error: 'Insufficient permissions to create phases' },
        { status: 403 }
      );
    }

    // Get the highest order number for the project and increment
    const maxOrderPhase = await prisma.phase.findFirst({
      where: { projectId: data.projectId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const nextOrder = (maxOrderPhase?.order ?? -1) + 1;

    const phase = await prisma.phase.create({
      data: {
        ...data,
        order: nextOrder,
      },
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

    return NextResponse.json(phase, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    throw error;
  }
}
