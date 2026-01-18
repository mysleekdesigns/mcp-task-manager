import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * DELETE /api/projects/[id]/members/[memberId]
 * Remove a member from the project by member ID (OWNER/ADMIN only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: projectId, memberId } = await params;

  try {
    // Verify user has permission to remove members
    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: session.user.id,
          projectId,
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

    // Get the membership to remove by memberId
    const memberToRemove = await prisma.projectMember.findUnique({
      where: {
        id: memberId,
      },
    });

    if (!memberToRemove || memberToRemove.projectId !== projectId) {
      return NextResponse.json(
        { error: 'Member not found in this project' },
        { status: 404 }
      );
    }

    // Prevent removing yourself
    if (memberToRemove.userId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot remove yourself from the project' },
        { status: 400 }
      );
    }

    // Prevent removing the last owner
    if (memberToRemove.role === 'OWNER') {
      const ownerCount = await prisma.projectMember.count({
        where: {
          projectId,
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
        id: memberId,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json(
      { error: 'Failed to remove member' },
      { status: 500 }
    );
  }
}
