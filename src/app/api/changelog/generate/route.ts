import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ChangelogType, TaskStatus } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Validation schema for generating changelog entries
const generateChangelogSchema = z.object({
  projectId: z.string().cuid(),
  version: z.string().optional(),
  since: z.string().datetime().optional(),
});

/**
 * Infer changelog type from task title and tags
 */
function inferChangelogType(title: string, tags: string[]): ChangelogType {
  const lowerTitle = title.toLowerCase();
  const lowerTags = tags.map(tag => tag.toLowerCase());

  // Check for breaking changes
  if (
    lowerTitle.includes('breaking') ||
    lowerTags.includes('breaking') ||
    lowerTitle.includes('breaking change')
  ) {
    return ChangelogType.BREAKING;
  }

  // Check for fixes
  if (
    lowerTitle.startsWith('fix') ||
    lowerTitle.includes('bug fix') ||
    lowerTitle.includes('bugfix') ||
    lowerTags.includes('fix') ||
    lowerTags.includes('bug')
  ) {
    return ChangelogType.FIX;
  }

  // Check for improvements
  if (
    lowerTitle.startsWith('improve') ||
    lowerTitle.startsWith('enhance') ||
    lowerTitle.startsWith('optimize') ||
    lowerTitle.startsWith('refactor') ||
    lowerTags.includes('improvement') ||
    lowerTags.includes('enhancement') ||
    lowerTags.includes('refactor')
  ) {
    return ChangelogType.IMPROVEMENT;
  }

  // Default to feature
  return ChangelogType.FEATURE;
}

/**
 * POST /api/changelog/generate
 * Auto-generate changelog entries from completed tasks
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = generateChangelogSchema.parse(body);

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

    // VIEWER role cannot generate changelog entries
    if (membership.role === 'VIEWER') {
      return NextResponse.json(
        { error: 'Insufficient permissions to generate changelog entries' },
        { status: 403 }
      );
    }

    // Find completed tasks that don't have changelog entries
    const completedTasks = await prisma.task.findMany({
      where: {
        projectId: data.projectId,
        status: TaskStatus.COMPLETED,
        parentId: null, // Only parent tasks
        changelogEntries: {
          none: {}, // Tasks without changelog entries
        },
        ...(data.since ? {
          updatedAt: {
            gte: new Date(data.since),
          },
        } : {}),
      },
      select: {
        id: true,
        title: true,
        description: true,
        tags: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    if (completedTasks.length === 0) {
      return NextResponse.json({
        message: 'No completed tasks without changelog entries found',
        count: 0,
        entries: [],
      });
    }

    // Create changelog entries for each completed task
    const createdEntries = await Promise.all(
      completedTasks.map(async (task) => {
        const type = inferChangelogType(task.title, task.tags);

        return prisma.changelogEntry.create({
          data: {
            title: task.title,
            description: task.description || undefined,
            version: data.version,
            type,
            taskId: task.id,
            projectId: data.projectId,
          },
          include: {
            task: {
              select: {
                id: true,
                title: true,
                status: true,
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
      })
    );

    return NextResponse.json({
      message: `Successfully generated ${createdEntries.length} changelog entries`,
      count: createdEntries.length,
      entries: createdEntries,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error generating changelog entries:', error);
    return NextResponse.json(
      { error: 'Failed to generate changelog entries', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
