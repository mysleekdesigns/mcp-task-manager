import { auth } from '@/lib/auth';

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="container mx-auto p-8">
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-14rem)] text-center">
        <div className="space-y-4 max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Welcome to Auto Claude
          </h1>

          <p className="text-lg text-muted-foreground">
            Hello, {session?.user?.name || session?.user?.email}
          </p>

          <p className="text-base text-muted-foreground/80">
            AI-driven development task management with Claude Code. Manage terminal sessions, track tasks through AI workflows, and maintain project context.
          </p>

          <div className="pt-6 space-y-2">
            <p className="text-sm text-muted-foreground">
              Select a page from the sidebar to get started.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
