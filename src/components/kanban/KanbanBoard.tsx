'use client';

import { useState, useId } from 'react';
import type { TaskStatus, Priority } from '@/types';
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
  defaultDropAnimationSideEffects,
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
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  tags: string[];
  phases: TaskPhase[];
  createdAt: Date;
  branchName: string | null;
}

interface KanbanBoardProps {
  initialTasks: Task[];
  projectId: string;
}

const COLUMNS: Array<{ id: string; title: string; status: TaskStatus }> = [
  { id: 'planning', title: 'Planning', status: 'PLANNING' },
  { id: 'in-progress', title: 'In Progress', status: 'IN_PROGRESS' },
  { id: 'ai-review', title: 'AI Review', status: 'AI_REVIEW' },
  { id: 'human-review', title: 'Human Review', status: 'HUMAN_REVIEW' },
  { id: 'completed', title: 'Completed', status: 'COMPLETED' },
];

export function KanbanBoard({ initialTasks, projectId }: KanbanBoardProps) {
  const dndContextId = useId();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isCompletedCollapsed, setIsCompletedCollapsed] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createModalDefaultStatus, setCreateModalDefaultStatus] = useState<TaskStatus | undefined>();
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

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  };

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
      const previousStatus = activeTask.status;

      // Optimistic update - update local state immediately
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === activeTask.id ? { ...task, status: newStatus } : task
        )
      );

      // Update task status on server
      try {
        const response = await fetch(`/api/tasks/${activeTask.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) {
          throw new Error('Failed to update task status');
        }

        toast.success('Task status updated');
      } catch (error) {
        console.error('Error updating task:', error);
        toast.error('Failed to update task status');

        // Revert optimistic update on error
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === activeTask.id ? { ...task, status: previousStatus } : task
          )
        );
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

  const handleAddTask = (status?: TaskStatus) => {
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
    <div className="space-y-3 md:space-y-4 px-2 md:px-4 lg:px-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold truncate">Kanban Board</h2>
          <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">
            Drag and drop tasks between columns to update their status
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="h-9 md:h-10 text-muted-foreground hover:text-cyan-400 active:text-cyan-400 shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''} md:mr-2`} />
          <span className="hidden md:inline">Refresh</span>
        </Button>
      </div>

      {/* Board */}
      <DndContext
        id={dndContextId}
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4 lg:gap-6">
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

        <DragOverlay dropAnimation={dropAnimation}>
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
        defaultStatus={createModalDefaultStatus}
        onSuccess={handleRefresh}
      />
      {editingTask && (
        <EditTaskModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          task={editingTask}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  );
}
