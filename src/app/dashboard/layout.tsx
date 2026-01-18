import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar - Fixed on the left */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-1 flex-col pl-60">
        {/* Header at top of main content */}
        <Header />

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
