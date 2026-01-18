import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import simpleGit from 'simple-git';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify user has access to this project
    const projectMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: session.user.id!,
          projectId: id,
        },
      },
      include: {
        project: true,
      },
    });

    if (!projectMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const project = projectMember.project;

    if (!project.targetPath) {
      return NextResponse.json(
        { error: 'Project has no target path configured' },
        { status: 400 }
      );
    }

    // Get branches from git
    const git = simpleGit(project.targetPath);
    const branchSummary = await git.branch();

    const branches = branchSummary.all.map((branch) => ({
      name: branch,
      current: branch === branchSummary.current,
    }));

    return NextResponse.json(branches);
  } catch (error) {
    console.error('Failed to fetch branches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch branches' },
      { status: 500 }
    );
  }
}
