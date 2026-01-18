import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Memory types enum
const MEMORY_TYPES = ['session', 'pr_review', 'codebase', 'pattern', 'gotcha'] as const;

// Validation schema for creating a memory
const createMemorySchema = z.object({
  type: z.enum(MEMORY_TYPES),
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  projectId: z.string().cuid(),
});

/**
 * GET /api/memories
 * List memories with optional filters (type, projectId, search query)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    // Build where clause
    const where: Prisma.MemoryWhereInput = {
      project: {
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
    };

    if (projectId) {
      where.projectId = projectId;
    }

    if (type && MEMORY_TYPES.includes(type as typeof MEMORY_TYPES[number])) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          content: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const memories = await prisma.memory.findMany({
      where,
      include: {
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

    return NextResponse.json(memories);
  } catch (error) {
    console.error('Error fetching memories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch memories', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/memories
 * Create a new memory
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = createMemorySchema.parse(body);

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

    // VIEWER role cannot create memories
    if (membership.role === 'VIEWER') {
      return NextResponse.json(
        { error: 'Insufficient permissions to create memories' },
        { status: 403 }
      );
    }

    const memory = await prisma.memory.create({
      data,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(memory, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    throw error;
  }
}
