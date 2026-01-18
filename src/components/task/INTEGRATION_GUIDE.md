# Task Components Integration Guide

Quick guide for integrating TaskModal and NewTaskModal into your application.

## Quick Start

### 1. Import Components

```tsx
import { TaskModal, NewTaskModal } from "@/components/task"
```

### 2. Add State Management

```tsx
const [selectedTask, setSelectedTask] = useState<Task | null>(null)
const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false)
```

### 3. Open Task Detail Modal

```tsx
// When clicking a task card
const handleTaskClick = (task: Task) => {
  setSelectedTask(task)
  setIsTaskModalOpen(true)
}

// In your JSX
<TaskModal
  task={selectedTask}
  open={isTaskModalOpen}
  onOpenChange={setIsTaskModalOpen}
  onUpdate={handleUpdateTask}
  onDelete={handleDeleteTask}
  onStop={handleStopTask}
  availableAssignees={teamMembers}
/>
```

### 4. Open New Task Modal

```tsx
// When clicking "New Task" button
<Button onClick={() => setIsNewTaskModalOpen(true)}>
  New Task
</Button>

// In your JSX
<NewTaskModal
  open={isNewTaskModalOpen}
  onOpenChange={setIsNewTaskModalOpen}
  onSuccess={handleTaskCreated}
  projectId={currentProjectId}
/>
```

## API Integration

### Update Task

```tsx
const handleUpdateTask = async (task: Task) => {
  try {
    const response = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: task.title,
        description: task.description,
        assigneeId: task.assigneeId,
        priority: task.priority,
        tags: task.tags,
        subtasks: task.subtasks,
      }),
    })

    if (!response.ok) throw new Error("Failed to update task")

    const updatedTask = await response.json()
    // Update local state
    setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t))
    router.refresh()
  } catch (error) {
    console.error("Error updating task:", error)
    throw error // TaskModal will show error toast
  }
}
```

### Delete Task

```tsx
const handleDeleteTask = async (taskId: string) => {
  try {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: "DELETE",
    })

    if (!response.ok) throw new Error("Failed to delete task")

    // Update local state
    setTasks(tasks.filter(t => t.id !== taskId))
    router.refresh()
  } catch (error) {
    console.error("Error deleting task:", error)
    throw error
  }
}
```

### Stop Task

```tsx
const handleStopTask = async (taskId: string) => {
  try {
    const response = await fetch(`/api/tasks/${taskId}/stop`, {
      method: "POST",
    })

    if (!response.ok) throw new Error("Failed to stop task")

    // Update local state
    const updatedTask = await response.json()
    setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t))
    router.refresh()
  } catch (error) {
    console.error("Error stopping task:", error)
    throw error
  }
}
```

### Create Task

```tsx
const handleTaskCreated = async (taskId: string, shouldStart: boolean) => {
  if (shouldStart) {
    try {
      await fetch(`/api/tasks/${taskId}/start`, {
        method: "POST",
      })
    } catch (error) {
      console.error("Error starting task:", error)
    }
  }

  // Fetch updated task list
  router.refresh()
}
```

## Kanban Board Integration

### Example: Draggable Task Card

```tsx
import { TaskModal } from "@/components/task"

function TaskCard({ task }: { task: Task }) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="cursor-pointer p-4 bg-card border rounded-md hover:shadow-md transition-shadow"
      >
        <h3 className="font-medium">{task.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {task.description}
        </p>
        <div className="flex gap-2 mt-2">
          <Badge>{task.priority}</Badge>
          {task.tags.map(tag => (
            <Badge key={tag} variant="outline">{tag}</Badge>
          ))}
        </div>
      </div>

      <TaskModal
        task={task}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
        onStop={handleStopTask}
      />
    </>
  )
}
```

## Dashboard Integration

### Example: New Task Button

```tsx
import { NewTaskModal } from "@/components/task"

function DashboardHeader() {
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false)

  return (
    <>
      <div className="flex justify-between items-center">
        <h1>Tasks</h1>
        <Button onClick={() => setIsNewTaskOpen(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      <NewTaskModal
        open={isNewTaskOpen}
        onOpenChange={setIsNewTaskOpen}
        onSuccess={handleTaskCreated}
        projectId={currentProjectId}
      />
    </>
  )
}
```

## Real-Time Updates

### Example: WebSocket Integration

```tsx
useEffect(() => {
  const ws = new WebSocket('ws://localhost:3001')

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)

    if (data.type === 'task_log') {
      // Update task logs in real-time
      setSelectedTask(prev => prev ? {
        ...prev,
        phaseLogs: updatePhaseLogs(prev.phaseLogs, data.log)
      } : null)
    }

    if (data.type === 'task_file_modified') {
      // Update modified files in real-time
      setSelectedTask(prev => prev ? {
        ...prev,
        modifiedFiles: [...(prev.modifiedFiles || []), data.file]
      } : null)
    }
  }

  return () => ws.close()
}, [])
```

## Data Transformation

### Example: API Response to Task Format

```tsx
function transformApiTask(apiTask: any): Task {
  return {
    id: apiTask.id,
    title: apiTask.title,
    description: apiTask.description || "",
    branchName: apiTask.branch_name,
    status: apiTask.status,
    assigneeId: apiTask.assignee_id,
    priority: apiTask.priority,
    tags: apiTask.tags || [],
    subtasks: apiTask.subtasks?.map((st: any) => ({
      id: st.id,
      title: st.title,
      completed: st.completed,
    })) || [],
    phaseLogs: apiTask.phase_logs?.map((pl: any) => ({
      name: pl.name,
      status: pl.status,
      model: pl.model,
      logs: pl.logs?.map((log: any) => ({
        id: log.id,
        type: log.type,
        message: log.message,
        output: log.output,
        timestamp: new Date(log.timestamp),
      })) || [],
    })) || [],
    modifiedFiles: apiTask.modified_files?.map((file: any) => ({
      id: file.id,
      path: file.path,
      action: file.action,
      linesAdded: file.lines_added,
      linesRemoved: file.lines_removed,
    })) || [],
    isRunning: apiTask.is_running || false,
  }
}
```

## Server Component Integration

### Example: Fetch Task Data

```tsx
// app/dashboard/tasks/[id]/page.tsx
import { TaskModal } from "@/components/task"
import { prisma } from "@/lib/prisma"

export default async function TaskPage({ params }: { params: { id: string } }) {
  const task = await prisma.task.findUnique({
    where: { id: params.id },
    include: {
      assignee: true,
      subtasks: true,
      phaseLogs: {
        include: { logs: true }
      },
      modifiedFiles: true,
    },
  })

  if (!task) return <div>Task not found</div>

  return <TaskModalClient task={task} />
}

// Task modal must be in a client component
"use client"
function TaskModalClient({ task }: { task: Task }) {
  return (
    <TaskModal
      task={task}
      open={true}
      onOpenChange={() => router.back()}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      onStop={handleStop}
    />
  )
}
```

## Common Patterns

### Loading State

```tsx
const [isLoading, setIsLoading] = useState(false)

const handleUpdateTask = async (task: Task) => {
  setIsLoading(true)
  try {
    // API call
  } finally {
    setIsLoading(false)
  }
}
```

### Error Handling

```tsx
const handleUpdateTask = async (task: Task) => {
  try {
    // API call
  } catch (error) {
    if (error instanceof Error) {
      toast.error(error.message)
    } else {
      toast.error("An unexpected error occurred")
    }
    throw error // Re-throw so modal knows update failed
  }
}
```

### Optimistic Updates

```tsx
const handleUpdateTask = async (task: Task) => {
  // Update UI immediately
  setTasks(tasks.map(t => t.id === task.id ? task : t))

  try {
    // API call
  } catch (error) {
    // Revert on error
    setTasks(tasks.map(t => t.id === task.id ? originalTask : t))
    throw error
  }
}
```

## Tips

1. Always handle errors in your callbacks - modals will show toast notifications
2. Use `router.refresh()` to update server components after mutations
3. Transform API data to match Task interface before passing to modals
4. Consider using React Query or SWR for better data management
5. Add loading states to prevent multiple submissions
6. Use optimistic updates for better UX
7. Implement WebSocket for real-time log updates
8. Cache task data to avoid refetching when reopening modal
9. Add keyboard shortcuts (e.g., Cmd+K to open new task modal)
10. Consider task context menu for quick actions
