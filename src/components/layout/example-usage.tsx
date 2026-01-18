/**
 * Example usage of the Sidebar component in a dashboard layout
 * 
 * This file is for documentation purposes only and should not be imported.
 * Copy the relevant patterns into your actual layout files.
 */

import { Sidebar } from "@/components/layout";
import { useState } from "react";

// Example 1: Basic Dashboard Layout
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar onNewTask={() => setIsNewTaskModalOpen(true)} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      {/* Your new task modal component would go here */}
    </div>
  );
}

// Example 2: With Custom New Task Handler
export function DashboardWithCustomHandler({ children }: { children: React.ReactNode }) {
  const handleNewTask = () => {
    // Custom logic: maybe open a dialog, navigate to a page, etc.
    console.log("Creating new task...");
    // router.push("/dashboard/tasks/new");
  };

  return (
    <div className="flex h-screen">
      <Sidebar onNewTask={handleNewTask} />
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  );
}

// Example 3: With Custom Styling
export function DashboardWithCustomStyling({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar 
        onNewTask={() => {/* handler */}}
        className="shadow-2xl"  // Add custom shadow
      />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

// Example 4: Recommended Next.js App Router Layout
// File: src/app/(dashboard)/layout.tsx
/*
import { Sidebar } from "@/components/layout";
import { NewTaskDialog } from "@/components/task/new-task-dialog";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      <NewTaskDialog />
    </div>
  );
}
*/
