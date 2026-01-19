import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { MoscowPriority } from '@prisma/client';

const convertSchema = z.object({
  priority: z.enum(['MUST', 'SHOULD', 'COULD', 'WONT']).optional(),
  phaseId: z.string().cuid().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = convertSchema.parse(body);

    // Fetch the idea to verify access
    const idea = await prisma.idea.findUnique({
      where: { id },
    });

    if (!idea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    // Check if idea is already converted
    if (idea.status === 'CONVERTED') {
      return NextResponse.json(
        { error: 'Idea has already been converted to a feature' },
        { status: 400 }
      );
    }

    // Verify user has access to the project
    const projectMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: session.user.id!,
          projectId: idea.projectId,
        },
      },
    });

    if (!projectMember) {
      return NextResponse.json(
        { error: 'Access denied to this project' },
        { status: 403 }
      );
    }

    // Only project admin/owner can convert ideas to features
    if (projectMember.role !== 'OWNER' && projectMember.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only project admin or owner can convert ideas to features' },
        { status: 403 }
      );
    }

    // If phaseId is provided, verify it exists and belongs to the project
    if (validatedData.phaseId) {
      const phase = await prisma.phase.findUnique({
        where: { id: validatedData.phaseId },
      });

      if (!phase || phase.projectId !== idea.projectId) {
        return NextResponse.json(
          { error: 'Invalid phase ID for this project' },
          { status: 400 }
        );
      }
    }

    // Determine priority based on votes or use provided priority
    let priority: MoscowPriority = validatedData.priority as MoscowPriority || 'SHOULD';
    if (!validatedData.priority) {
      // Auto-assign priority based on votes
      if (idea.votes >= 10) {
        priority = 'MUST';
      } else if (idea.votes >= 5) {
        priority = 'SHOULD';
      } else if (idea.votes >= 2) {
        priority = 'COULD';
      } else {
        priority = 'SHOULD';
      }
    }

    // Create the feature and update the idea in a transaction
    const [feature, updatedIdea] = await prisma.$transaction([
      prisma.feature.create({
        data: {
          title: idea.title,
          description: idea.description,
          priority,
          status: 'planned',
          projectId: idea.projectId,
          ...(validatedData.phaseId && { phaseId: validatedData.phaseId }),
        },
      }),
      prisma.idea.update({
        where: { id },
        data: {
          status: 'CONVERTED',
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      idea: updatedIdea,
      feature,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error converting idea to feature:', error);
    return NextResponse.json(
      { error: 'Failed to convert idea to feature' },
      { status: 500 }
    );
  }
}
