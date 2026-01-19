import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { IdeationBoard } from '@/components/ideation/ideation-board';

export default async function IdeationPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Get the user's first project and their role in it
  const projectMember = await prisma.projectMember.findFirst({
    where: {
      userId: session.user.id,
    },
    include: {
      project: true,
    },
  });

  if (!projectMember) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Ideation Board</h1>
        <p className="text-muted-foreground mt-2">
          No projects found. Please create a project first.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <IdeationBoard
        projectId={projectMember.project.id}
        userRole={projectMember.role}
        userId={session.user.id}
      />
    </div>
  );
}
