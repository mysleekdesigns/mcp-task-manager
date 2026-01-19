import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createIdeaSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().optional(),
  projectId: z.string().cuid('Invalid project ID'),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const sortBy = searchParams.get('sortBy') || 'votes';
    const sortDirectionParam = searchParams.get('sortDirection') || 'desc';
    const sortDirection = (sortDirectionParam === 'asc' || sortDirectionParam === 'desc' ? sortDirectionParam : 'desc') as 'asc' | 'desc';
    const status = searchParams.get('status');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Verify user has access to the project
    const projectMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: session.user.id!,
          projectId,
        },
      },
    });

    if (!projectMember) {
      return NextResponse.json(
        { error: 'Access denied to this project' },
        { status: 403 }
      );
    }

    // Build orderBy clause
    const orderBy: Record<string, 'asc' | 'desc'> = {};
    if (sortBy === 'votes') {
      orderBy.votes = sortDirection;
    } else if (sortBy === 'date') {
      orderBy.createdAt = sortDirection;
    } else if (sortBy === 'title') {
      orderBy.title = sortDirection;
    }

    // Build where clause
    const where: Record<string, unknown> = { projectId };
    if (status) {
      where.status = status;
    }

    const ideas = await prisma.idea.findMany({
      where,
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
      orderBy,
    });

    return NextResponse.json(ideas);
  } catch (error) {
    console.error('Error fetching ideas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ideas' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createIdeaSchema.parse(body);

    // Verify user has access to the project
    const projectMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: session.user.id!,
          projectId: validatedData.projectId,
        },
      },
    });

    if (!projectMember) {
      return NextResponse.json(
        { error: 'Access denied to this project' },
        { status: 403 }
      );
    }

    const idea = await prisma.idea.create({
      data: {
        title: validatedData.title,
        description: validatedData.description || null,
        projectId: validatedData.projectId,
        createdById: session.user.id!,
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
    });

    return NextResponse.json(idea, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating idea:', error);
    return NextResponse.json(
      { error: 'Failed to create idea' },
      { status: 500 }
    );
  }
}
