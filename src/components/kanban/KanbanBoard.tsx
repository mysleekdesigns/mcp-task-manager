'use client';

import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { CreateTaskModal } from './CreateTaskModal';
import { EditTaskModal } from './EditTaskModal';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface TaskPhase {
  id: string;
  name: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
}

interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  tags: string[];
  phases: TaskPhase[];
  createdAt: Date;
}

interface KanbanBoardProps {
  initialTasks: Task[];
  projectId: string;
}

const COLUMNS = [
  { id: 'planning', title: 'Planning', status: 'PLANNING' },
  { id: 'in-progress', title: 'In Progress', status: 'IN_PROGRESS' },
  { id: 'ai-review', title: 'AI Review', status: 'AI_REVIEW' },
  { id: 'human-review', title: 'Human Review', status: 'HUMAN_REVIEW' },
  { id: 'completed', title: 'Completed', status: 'COMPLETED' },
];

export function KanbanBoard({ initialTasks, projectId }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isCompletedCollapsed, setIsCompletedCollapsed] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createModalDefaultStatus, setCreateModalDefaultStatus] = useState<string | undefined>();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    // Check if dropped on a column
    const overColumn = COLUMNS.find((c) => c.id === over.id);
    const newStatus = overColumn?.status;

    if (newStatus && activeTask.status !== newStatus) {
      // Update task status
      try {
        const response = await fetch(`/api/tasks/${activeTask.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) {
          throw new Error('Failed to update task status');
        }

        // Update local state
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === activeTask.id ? { ...task, status: newStatus } : task
          )
        );

        toast.success('Task status updated');
      } catch (error) {
        console.error('Error updating task:', error);
        toast.error('Failed to update task status');
      }
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/tasks`);
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      const data = await response.json();
      setTasks(data.tasks || []);
      toast.success('Tasks refreshed');
    } catch (error) {
      console.error('Error refreshing tasks:', error);
      toast.error('Failed to refresh tasks');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAddTask = (status?: string) => {
    setCreateModalDefaultStatus(status);
    setCreateModalOpen(true);
  };

  const handleStartTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/start`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to start task');
      }

      toast.success('Task started');
      handleRefresh();
    } catch (error) {
      console.error('Error starting task:', error);
      toast.error('Failed to start task');
    }
  };

  const handleStopTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/stop`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to stop task');
      }

      toast.success('Task stopped');
      handleRefresh();
    } catch (error) {
      console.error('Error stopping task:', error);
      toast.error('Failed to stop task');
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setEditModalOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      setTasks((prevTasks) => prevTasks.filter((t) => t.id !== taskId));
      toast.success('Task deleted');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Kanban Board</h2>
          <p className="text-sm text-muted-foreground">
            Drag and drop tasks between columns to update their status
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={tasks}
              isCollapsed={column.status === 'COMPLETED' && isCompletedCollapsed}
              onToggleCollapse={
                column.status === 'COMPLETED'
                  ? () => setIsCompletedCollapsed(!isCompletedCollapsed)
                  : undefined
              }
              onAddTask={handleAddTask}
              onStartTask={handleStartTask}
              onStopTask={handleStopTask}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="cursor-grabbing rotate-3">
              <TaskCard task={activeTask} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Modals */}
      <CreateTaskModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        projectId={projectId}
        defaultStatus={createModalDefaultStatus as any}
        onSuccess={handleRefresh}
      />
      {editingTask && (
        <EditTaskModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          task={editingTask as any}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  );
}
