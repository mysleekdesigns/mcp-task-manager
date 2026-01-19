import { auth } from '@/lib/auth';
import { WelcomePage } from '@/components/dashboard/welcome-page';

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="p-6">
      <div className="space-y-8">
        {/* Welcome header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Welcome back{session?.user?.name ? `, ${session.user.name}` : ''}
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            AI-driven development task management with Claude Code. Manage terminal sessions, track tasks through AI workflows, and maintain project context.
          </p>
        </div>

        {/* Welcome page with project cards */}
        <WelcomePage currentUserId={session?.user?.id} />
      </div>
    </div>
  );
}
