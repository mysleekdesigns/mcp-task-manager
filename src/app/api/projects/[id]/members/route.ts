import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Validation schema for adding a member
const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']).default('MEMBER'),
});

// Validation schema for removing a member
const removeMemberSchema = z.object({
  userId: z.string().cuid(),
});

/**
 * GET /api/projects/[id]/members
 * List all members of a project
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

  // Verify user is a member of the project
  const membership = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId: session.user.id,
        projectId: id,
      },
    },
  });

  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const members = await prisma.projectMember.findMany({
    where: {
      projectId: id,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: [
      { role: 'asc' }, // OWNER first
      { createdAt: 'asc' },
    ],
  });

  return NextResponse.json(members);
}

/**
 * POST /api/projects/[id]/members
 * Add a member to the project by email with role
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const data = addMemberSchema.parse(body);

    // Verify user has permission to add members (OWNER or ADMIN)
    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: session.user.id,
          projectId: id,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only owners and admins can add members' },
        { status: 403 }
      );
    }

    // Find user by email
    const userToAdd = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!userToAdd) {
      return NextResponse.json(
        { error: 'User with this email not found' },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const existingMembership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: userToAdd.id,
          projectId: id,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: 'User is already a member of this project' },
        { status: 400 }
      );
    }

    // Only OWNER can add other OWNERS
    if (data.role === 'OWNER' && membership.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only project owner can add other owners' },
        { status: 403 }
      );
    }

    // Create the membership
    const newMember = await prisma.projectMember.create({
      data: {
        userId: userToAdd.id,
        projectId: id,
        role: data.role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    throw error;
  }
}

/**
 * DELETE /api/projects/[id]/members
 * Remove a member from the project (OWNER/ADMIN only)
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

  try {
    const body = await request.json();
    const data = removeMemberSchema.parse(body);

    // Verify user has permission to remove members
    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: session.user.id,
          projectId: id,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only owners and admins can remove members' },
        { status: 403 }
      );
    }

    // Get the membership to remove
    const memberToRemove = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: data.userId,
          projectId: id,
        },
      },
    });

    if (!memberToRemove) {
      return NextResponse.json(
        { error: 'Member not found in this project' },
        { status: 404 }
      );
    }

    // Prevent removing the last owner
    if (memberToRemove.role === 'OWNER') {
      const ownerCount = await prisma.projectMember.count({
        where: {
          projectId: id,
          role: 'OWNER',
        },
      });

      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last owner of the project' },
          { status: 400 }
        );
      }

      // Only OWNER can remove another OWNER
      if (membership.role !== 'OWNER') {
        return NextResponse.json(
          { error: 'Only project owner can remove other owners' },
          { status: 403 }
        );
      }
    }

    // Remove the member
    await prisma.projectMember.delete({
      where: {
        userId_projectId: {
          userId: data.userId,
          projectId: id,
        },
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    throw error;
  }
}
