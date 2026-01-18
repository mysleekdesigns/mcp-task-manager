import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Memory types enum
const MEMORY_TYPES = ['session', 'pr_review', 'codebase', 'pattern', 'gotcha'] as const;

/**
 * GET /api/memories/search
 * Search memories by query string with optional type filtering
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type');
    const projectId = searchParams.get('projectId');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    // Build where clause
    const where: Prisma.MemoryWhereInput = {
      project: {
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
      OR: [
        {
          title: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          content: {
            contains: query,
            mode: 'insensitive',
          },
        },
      ],
    };

    if (projectId) {
      where.projectId = projectId;
    }

    if (type && MEMORY_TYPES.includes(type as typeof MEMORY_TYPES[number])) {
      where.type = type;
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
      orderBy: [
        // Sort by relevance: title matches first, then by date
        {
          createdAt: 'desc',
        },
      ],
    });

    // Enhanced relevance sorting (title matches score higher)
    const sortedMemories = memories.sort((a, b) => {
      const aInTitle = a.title.toLowerCase().includes(query.toLowerCase());
      const bInTitle = b.title.toLowerCase().includes(query.toLowerCase());

      if (aInTitle && !bInTitle) return -1;
      if (!aInTitle && bInTitle) return 1;

      // If both or neither have title matches, maintain date order
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json(sortedMemories);
  } catch (error) {
    console.error('Error searching memories:', error);
    return NextResponse.json(
      { error: 'Failed to search memories', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
