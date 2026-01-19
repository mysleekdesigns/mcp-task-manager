import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Validation schema for updating a changelog entry
const updateChangelogSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  version: z.string().optional(),
  type: z.enum(['FEATURE', 'FIX', 'IMPROVEMENT', 'BREAKING']).optional(),
});

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/changelog/[id]
 * Get a single changelog entry by ID
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const entry = await prisma.changelogEntry.findUnique({
      where: { id },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            description: true,
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

    if (!entry) {
      return NextResponse.json({ error: 'Changelog entry not found' }, { status: 404 });
    }

    // Verify user is a member of the project
    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: session.user.id,
          projectId: entry.projectId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Error fetching changelog entry:', error);
    return NextResponse.json(
      { error: 'Failed to fetch changelog entry', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/changelog/[id]
 * Update a changelog entry
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const data = updateChangelogSchema.parse(body);

    // Get existing entry to check permissions
    const existingEntry = await prisma.changelogEntry.findUnique({
      where: { id },
      select: { projectId: true },
    });

    if (!existingEntry) {
      return NextResponse.json({ error: 'Changelog entry not found' }, { status: 404 });
    }

    // Verify user is a member of the project with write permissions
    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: session.user.id,
          projectId: existingEntry.projectId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // VIEWER role cannot update changelog entries
    if (membership.role === 'VIEWER') {
      return NextResponse.json(
        { error: 'Insufficient permissions to update changelog entries' },
        { status: 403 }
      );
    }

    const entry = await prisma.changelogEntry.update({
      where: { id },
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

    return NextResponse.json(entry);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error updating changelog entry:', error);
    return NextResponse.json(
      { error: 'Failed to update changelog entry', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/changelog/[id]
 * Delete a changelog entry
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Get existing entry to check permissions
    const existingEntry = await prisma.changelogEntry.findUnique({
      where: { id },
      select: { projectId: true },
    });

    if (!existingEntry) {
      return NextResponse.json({ error: 'Changelog entry not found' }, { status: 404 });
    }

    // Verify user is a member of the project with admin or owner permissions
    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: session.user.id,
          projectId: existingEntry.projectId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only ADMIN and OWNER can delete changelog entries
    if (membership.role !== 'ADMIN' && membership.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete changelog entries' },
        { status: 403 }
      );
    }

    await prisma.changelogEntry.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting changelog entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete changelog entry', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
