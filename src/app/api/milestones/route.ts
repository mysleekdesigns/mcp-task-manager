import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Validation schema for creating a milestone
const createMilestoneSchema = z.object({
  title: z.string().min(1).max(255),
  phaseId: z.string().cuid(),
});

/**
 * GET /api/milestones
 * List milestones, filter by phaseId
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const phaseId = searchParams.get('phaseId');

    if (!phaseId) {
      return NextResponse.json(
        { error: 'phaseId query parameter is required' },
        { status: 400 }
      );
    }

    // Find the phase to verify project membership
    const phase = await prisma.phase.findUnique({
      where: { id: phaseId },
      select: { projectId: true },
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

    const milestones = await prisma.milestone.findMany({
      where: {
        phaseId,
      },
      include: {
        phase: {
          select: {
            id: true,
            name: true,
            order: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json(milestones);
  } catch (error) {
    console.error('Error fetching milestones:', error);
    return NextResponse.json(
      { error: 'Failed to fetch milestones', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/milestones
 * Create a new milestone
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = createMilestoneSchema.parse(body);

    // Find the phase to verify project membership
    const phase = await prisma.phase.findUnique({
      where: { id: data.phaseId },
      select: { projectId: true },
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

    // VIEWER role cannot create milestones
    if (membership.role === 'VIEWER') {
      return NextResponse.json(
        { error: 'Insufficient permissions to create milestones' },
        { status: 403 }
      );
    }

    const milestone = await prisma.milestone.create({
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

    return NextResponse.json(milestone, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    throw error;
  }
}
