# Kanban Board Components

Drag-and-drop Kanban board implementation using @dnd-kit for task management.

## Components

### KanbanBoard

Main board component that handles drag-and-drop logic and task management.

**Props:**
- `initialTasks`: Array of tasks to display
- `projectId`: ID of the current project

**Features:**
- Drag and drop tasks between columns
- Refresh tasks from API
- Start/Stop task execution
- Delete tasks
- Collapsible Completed column

### KanbanColumn

Individual column component representing a task status.

**Props:**
- `column`: Column configuration (id, title, status)
- `tasks`: All tasks (filtered internally by status)
- `isCollapsed`: Whether the column is collapsed
- `onToggleCollapse`: Handler for toggling collapse state
- `onAddTask`: Handler for adding new tasks
- `onStartTask`: Handler for starting a task
- `onStopTask`: Handler for stopping a task
- `onEditTask`: Handler for editing a task
- `onDeleteTask`: Handler for deleting a task

**Features:**
- Droppable area for task cards
- Task count badge
- Add task button
- Empty state

### TaskCard

Draggable card component for individual tasks.

**Props:**
- `task`: Task data with phases
- `onStart`: Handler for starting the task
- `onStop`: Handler for stopping the task
- `onEdit`: Handler for editing the task
- `onDelete`: Handler for deleting the task

**Features:**
- Drag handle
- Title and description preview
- Tag badges (Feature, Bug, Trivial)
- Phase progress indicator (Plan → Code → QA)
- Status badge (Running, Pending)
- Time ago indicator
- Start/Stop button
- Action menu (Edit, View, Delete)

## Columns

The board has 5 columns:

1. **Planning** - Tasks in planning phase
2. **In Progress** - Tasks currently being worked on
3. **AI Review** - Tasks under AI review
4. **Human Review** - Tasks under human review
5. **Completed** - Completed tasks (collapsible)

## API Routes

### GET /api/projects/[id]/tasks
Fetch all tasks for a project with phases.

### PATCH /api/tasks/[id]
Update task status (for drag-and-drop).

### POST /api/tasks/[id]/start
Start a task by setting the first pending phase to running.

### POST /api/tasks/[id]/stop
Stop a task by setting all running phases to pending.

### DELETE /api/tasks/[id]
Delete a task.

## Usage

```tsx
import { KanbanBoard } from '@/components/kanban';

export default async function KanbanPage() {
  const tasks = await fetchTasks();

  return (
    <KanbanBoard initialTasks={tasks} projectId={projectId} />
  );
}
```

## Task Data Structure

```typescript
interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: 'PLANNING' | 'IN_PROGRESS' | 'AI_REVIEW' | 'HUMAN_REVIEW' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  tags: string[];
  phases: TaskPhase[];
  createdAt: Date;
}

interface TaskPhase {
  id: string;
  name: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
}
```

## Styling

Uses Tailwind CSS and shadcn/ui components:
- Card
- Badge
- Button
- DropdownMenu
- Toast notifications (sonner)

## Performance

- Uses `@dnd-kit/sortable` for efficient drag-and-drop
- Keyboard support for accessibility
- Optimistic UI updates
- Debounced API calls
