import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ChangelogType, Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Validation schema for creating a changelog entry
const createChangelogSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  version: z.string().optional(),
  type: z.enum(['FEATURE', 'FIX', 'IMPROVEMENT', 'BREAKING']).default('FEATURE'),
  taskId: z.string().cuid().optional(),
  projectId: z.string().cuid(),
});

/**
 * GET /api/changelog
 * List changelog entries with optional filters (projectId, version, type)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const version = searchParams.get('version');
    const type = searchParams.get('type');
    const groupBy = searchParams.get('groupBy'); // 'date' or 'version'

    // Build where clause
    const where: Prisma.ChangelogEntryWhereInput = {
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

    if (version) {
      where.version = version;
    }

    if (type && Object.values(ChangelogType).includes(type as ChangelogType)) {
      where.type = type as ChangelogType;
    }

    const entries = await prisma.changelogEntry.findMany({
      where,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Group entries if requested
    if (groupBy === 'date') {
      const grouped = entries.reduce((acc, entry) => {
        const date = entry.createdAt.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(entry);
        return acc;
      }, {} as Record<string, typeof entries>);

      return NextResponse.json({
        grouped: Object.entries(grouped).map(([date, entries]) => ({
          date,
          entries,
        })),
      });
    }

    if (groupBy === 'version') {
      const grouped = entries.reduce((acc, entry) => {
        const version = entry.version || 'Unversioned';
        if (!acc[version]) {
          acc[version] = [];
        }
        acc[version].push(entry);
        return acc;
      }, {} as Record<string, typeof entries>);

      return NextResponse.json({
        grouped: Object.entries(grouped).map(([version, entries]) => ({
          version,
          entries,
        })),
      });
    }

    return NextResponse.json(entries);
  } catch (error) {
    console.error('Error fetching changelog entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch changelog entries', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/changelog
 * Create a new changelog entry
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = createChangelogSchema.parse(body);

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

    // VIEWER role cannot create changelog entries
    if (membership.role === 'VIEWER') {
      return NextResponse.json(
        { error: 'Insufficient permissions to create changelog entries' },
        { status: 403 }
      );
    }

    // If taskId is provided, verify it exists and belongs to the same project
    if (data.taskId) {
      const task = await prisma.task.findUnique({
        where: { id: data.taskId },
        select: { projectId: true },
      });

      if (!task) {
        return NextResponse.json(
          { error: 'Task not found' },
          { status: 404 }
        );
      }

      if (task.projectId !== data.projectId) {
        return NextResponse.json(
          { error: 'Task must belong to the same project' },
          { status: 400 }
        );
      }
    }

    const entry = await prisma.changelogEntry.create({
      data,
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

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error creating changelog entry:', error);
    return NextResponse.json(
      { error: 'Failed to create changelog entry', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
