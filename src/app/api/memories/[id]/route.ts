import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * GET /api/memories/[id]
 * Get a single memory by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Fetch memory and verify project membership
  const memory = await prisma.memory.findUnique({
    where: { id },
    include: {
      project: {
        include: {
          members: {
            where: {
              userId: session.user.id,
            },
          },
        },
      },
    },
  });

  if (!memory) {
    return NextResponse.json({ error: 'Memory not found' }, { status: 404 });
  }

  // Verify user is a member of the project
  if (memory.project.members.length === 0) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json(memory);
}

/**
 * DELETE /api/memories/[id]
 * Delete a memory by ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Fetch memory and verify membership
  const memory = await prisma.memory.findUnique({
    where: { id },
    include: {
      project: {
        include: {
          members: {
            where: {
              userId: session.user.id,
            },
          },
        },
      },
    },
  });

  if (!memory) {
    return NextResponse.json({ error: 'Memory not found' }, { status: 404 });
  }

  // Verify user is a member of the project
  const membership = memory.project.members[0];
  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Only OWNER, ADMIN, and MEMBER can delete memories
  if (membership.role === 'VIEWER') {
    return NextResponse.json(
      { error: 'Insufficient permissions to delete memories' },
      { status: 403 }
    );
  }

  await prisma.memory.delete({
    where: { id },
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
