/**
 * Example usage of TaskModal and NewTaskModal components
 * This file demonstrates how to integrate the task modals in your application
 */

"use client"

import * as React from "react"
import { TaskModal, NewTaskModal } from "@/components/task"
import { Button } from "@/components/ui/button"

export function TaskModalExample() {
  const [isTaskModalOpen, setIsTaskModalOpen] = React.useState(false)
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = React.useState(false)

  // Example task data
  const exampleTask = {
    id: "task-1",
    title: "Implement user authentication",
    description: "Add JWT-based authentication with login and register endpoints",
    branchName: "feature/auth-implementation",
    status: "IN_PROGRESS",
    assigneeId: "user-1",
    priority: "HIGH" as const,
    tags: ["authentication", "security", "backend"],
    isRunning: true,
    subtasks: [
      { id: "sub-1", title: "Create user model", completed: true },
      { id: "sub-2", title: "Implement JWT generation", completed: true },
      { id: "sub-3", title: "Add login endpoint", completed: false },
      { id: "sub-4", title: "Add register endpoint", completed: false },
    ],
    phaseLogs: [
      {
        name: "Planning",
        status: "completed" as const,
        model: "claude-3-opus",
        logs: [
          {
            id: "log-1",
            type: "phase_start" as const,
            message: "Starting planning phase",
            timestamp: new Date("2026-01-18T10:00:00"),
          },
          {
            id: "log-2",
            type: "ai_response" as const,
            message: "Generated implementation plan",
            output: "1. Create user model with email and password fields\n2. Add bcrypt for password hashing\n3. Implement JWT token generation\n4. Create authentication middleware",
            timestamp: new Date("2026-01-18T10:05:00"),
          },
        ],
      },
      {
        name: "Coding",
        status: "in_progress" as const,
        model: "claude-3-opus",
        logs: [
          {
            id: "log-3",
            type: "file_write" as const,
            message: "Created src/models/User.ts",
            timestamp: new Date("2026-01-18T10:10:00"),
          },
          {
            id: "log-4",
            type: "file_write" as const,
            message: "Created src/utils/jwt.ts",
            timestamp: new Date("2026-01-18T10:15:00"),
          },
        ],
      },
    ],
    modifiedFiles: [
      {
        id: "file-1",
        path: "src/models/User.ts",
        action: "created" as const,
      },
      {
        id: "file-2",
        path: "src/utils/jwt.ts",
        action: "created" as const,
      },
      {
        id: "file-3",
        path: "src/api/auth/route.ts",
        action: "modified" as const,
        linesAdded: 45,
        linesRemoved: 12,
      },
    ],
  }

  const availableAssignees = [
    { id: "user-1", name: "John Doe", email: "john@example.com" },
    { id: "user-2", name: "Jane Smith", email: "jane@example.com" },
  ]

  const availableProjects = [
    { id: "project-1", name: "My Awesome Project" },
    { id: "project-2", name: "Another Project" },
  ]

  const handleTaskUpdate = async (task: any) => {
    console.log("Updating task:", task)
    // API call to update task
    // await fetch(`/api/tasks/${task.id}`, { method: "PATCH", body: JSON.stringify(task) })
  }

  const handleTaskDelete = async (taskId: string) => {
    console.log("Deleting task:", taskId)
    // API call to delete task
    // await fetch(`/api/tasks/${taskId}`, { method: "DELETE" })
  }

  const handleTaskStop = async (taskId: string) => {
    console.log("Stopping task:", taskId)
    // API call to stop task processing
    // await fetch(`/api/tasks/${taskId}/stop`, { method: "POST" })
  }

  const handleNewTaskSuccess = (taskId: string, shouldStart: boolean) => {
    console.log("New task created:", taskId, "Start:", shouldStart)
    if (shouldStart) {
      // API call to start task processing
      // await fetch(`/api/tasks/${taskId}/start`, { method: "POST" })
    }
  }

  return (
    <div className="p-8 space-y-4">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Task Modals Example</h2>
        <p className="text-muted-foreground">
          Click the buttons below to open the task modals
        </p>
      </div>

      <div className="flex gap-4">
        <Button onClick={() => setIsTaskModalOpen(true)}>
          Open Task Detail Modal
        </Button>
        <Button onClick={() => setIsNewTaskModalOpen(true)}>
          Open New Task Modal
        </Button>
      </div>

      <TaskModal
        task={exampleTask}
        open={isTaskModalOpen}
        onOpenChange={setIsTaskModalOpen}
        onUpdate={handleTaskUpdate}
        onDelete={handleTaskDelete}
        onStop={handleTaskStop}
        availableAssignees={availableAssignees}
      />

      <NewTaskModal
        open={isNewTaskModalOpen}
        onOpenChange={setIsNewTaskModalOpen}
        onSuccess={handleNewTaskSuccess}
        projectId="project-1"
        availableProjects={availableProjects}
      />
    </div>
  )
}
