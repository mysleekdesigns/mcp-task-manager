import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';

export default async function KanbanPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Get the user's first project (for now)
  // In a real app, you'd select the project from a dropdown or URL param
  const project = await prisma.project.findFirst({
    where: {
      members: {
        some: {
          userId: session.user.id,
        },
      },
    },
  });

  if (!project) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Kanban Board</h1>
        <p className="text-muted-foreground mt-2">
          No projects found. Please create a project first.
        </p>
      </div>
    );
  }

  // Fetch all tasks for the project with phases
  const tasks = await prisma.task.findMany({
    where: {
      projectId: project.id,
    },
    include: {
      phases: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Convert to plain objects for client component
  const serializedTasks = tasks.map((task) => ({
    ...task,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    phases: task.phases.map((phase) => ({
      ...phase,
      createdAt: phase.createdAt,
      startedAt: phase.startedAt,
      endedAt: phase.endedAt,
    })),
  }));

  return (
    <div className="p-6">
      <KanbanBoard initialTasks={serializedTasks} projectId={project.id} />
    </div>
  );
}
