# Task Components

Task modal and new task flow components for Phase 3.4 and 3.5 of the Claude Tasks project.

## Components

### TaskModal

Full-featured task detail modal with tabbed interface.

**Features:**
- Editable title with edit/save/cancel buttons
- Branch name and status badges
- Four tabs: Overview, Subtasks, Logs, Files
- Delete and stop task actions
- Confirmation dialog for destructive actions

**Props:**
```typescript
interface TaskModalProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate?: (task: Task) => void
  onDelete?: (taskId: string) => void
  onStop?: (taskId: string) => void
  availableAssignees?: Array<{ id: string; name: string | null; email: string }>
}
```

**Usage:**
```tsx
import { TaskModal } from "@/components/task"

<TaskModal
  task={task}
  open={isOpen}
  onOpenChange={setIsOpen}
  onUpdate={handleUpdate}
  onDelete={handleDelete}
  onStop={handleStop}
  availableAssignees={assignees}
/>
```

### NewTaskModal

Modal for creating new tasks with option to start immediately.

**Features:**
- Title and description inputs
- Priority selector (LOW, MEDIUM, HIGH, URGENT)
- Tag management with chip interface
- Project selector (if multiple projects)
- Two submit options: "Create" and "Create and Start"

**Props:**
```typescript
interface NewTaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (taskId: string, shouldStart: boolean) => void
  projectId?: string
  availableProjects?: Array<{ id: string; name: string }>
}
```

**Usage:**
```tsx
import { NewTaskModal } from "@/components/task"

<NewTaskModal
  open={isOpen}
  onOpenChange={setIsOpen}
  onSuccess={handleSuccess}
  projectId={projectId}
  availableProjects={projects}
/>
```

## Tab Components

### OverviewTab

Displays and edits task overview information.

**Fields:**
- Description (textarea)
- Assignee selector
- Priority selector
- Tags with add/remove functionality

### SubtasksTab

Manages task subtasks.

**Features:**
- Progress indicator (X of Y completed)
- Checkbox to toggle completion
- Add new subtask inline
- Delete subtask button
- Shows completion percentage

### LogsTab

Displays task execution logs organized by phase.

**Features:**
- Collapsible phase sections
- Phase status and model badges
- Log type icons (phase_start, file_read, ai_response, etc.)
- Expandable output sections
- Timestamp formatting

### FilesTab

Shows modified files with action indicators.

**Features:**
- File action badges (created, modified, deleted)
- Line change indicators (+X/-Y for modified files)
- Grouped summary statistics
- File path display with icons

## Data Types

### Task
```typescript
interface Task {
  id: string
  title: string
  description: string
  branchName?: string
  status: string
  assigneeId: string | null
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  tags: string[]
  subtasks?: Subtask[]
  phaseLogs?: PhaseLog[]
  modifiedFiles?: ModifiedFile[]
  isRunning?: boolean
}
```

### Subtask
```typescript
interface Subtask {
  id: string
  title: string
  completed: boolean
}
```

### PhaseLog
```typescript
interface PhaseLog {
  name: string
  status: "pending" | "in_progress" | "completed" | "failed"
  model?: string
  logs: LogEntry[]
}
```

### LogEntry
```typescript
interface LogEntry {
  id: string
  type: "phase_start" | "file_read" | "file_write" | "ai_response" | "command" | "error"
  message: string
  output?: string
  timestamp: Date
}
```

### ModifiedFile
```typescript
interface ModifiedFile {
  id: string
  path: string
  action: "created" | "modified" | "deleted"
  linesAdded?: number
  linesRemoved?: number
}
```

## Example

See `example-usage.tsx` for a complete working example with sample data.

## Dependencies

- shadcn/ui components: Dialog, Tabs, Button, Input, Textarea, Select, Badge, AlertDialog
- lucide-react icons
- react-hook-form with Zod validation
- sonner for toast notifications

## Styling

Components use Tailwind CSS v4 with the project's design tokens:
- Colors: primary, secondary, accent, muted, destructive
- Consistent spacing and border radius
- Dark mode support via CSS variables

## Notes

- All modals use the Dialog component for accessibility
- Form validation uses Zod schemas
- Tags are managed with inline input and Enter key
- Subtasks use crypto.randomUUID() for client-side IDs
- Logs and files tabs are read-only views
- Edit mode is toggled via pencil icon in header
