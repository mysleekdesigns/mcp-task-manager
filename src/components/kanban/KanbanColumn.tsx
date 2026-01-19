'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TaskCard } from './TaskCard';

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

interface Column {
  id: string;
  title: string;
  status: string;
}

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onAddTask?: (status: string) => void;
  onStartTask?: (taskId: string) => void;
  onStopTask?: (taskId: string) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
}

export function KanbanColumn({
  column,
  tasks,
  isCollapsed = false,
  onToggleCollapse,
  onAddTask,
  onStartTask,
  onStopTask,
  onEditTask,
  onDeleteTask,
}: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: column.id,
    data: {
      type: 'column',
      status: column.status,
    },
  });

  const columnTasks = tasks.filter((task) => task.status === column.status);

  return (
    <div className="flex-shrink-0 w-80">
      <Card className="p-4">
        {/* Column Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">{column.title}</h3>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {columnTasks.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {column.status === 'COMPLETED' && onToggleCollapse && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCollapse}
                className="h-7 px-2"
              >
                {isCollapsed ? 'Expand' : 'Collapse'}
              </Button>
            )}
            {onAddTask && !isCollapsed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAddTask(column.status)}
                className="h-7 px-2"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Tasks List */}
        {!isCollapsed && (
          <div
            ref={setNodeRef}
            className="space-y-2 min-h-[400px]"
          >
            <SortableContext
              items={columnTasks.map((task) => task.id)}
              strategy={verticalListSortingStrategy}
            >
              {columnTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStart={onStartTask}
                  onStop={onStopTask}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                />
              ))}
            </SortableContext>

            {/* Empty State */}
            {columnTasks.length === 0 && (
              <div className="flex flex-col items-center justify-center h-[200px] text-center text-muted-foreground">
                <p className="text-sm mb-3">No tasks</p>
                {onAddTask && (
                  <Button
                    size="sm"
                    onClick={() => onAddTask(column.status)}
                    className="gap-2 bg-sidebar-primary hover:bg-sidebar-primary/90 text-slate-900"
                  >
                    <Plus className="h-4 w-4" />
                    Add a task
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Collapsed State */}
        {isCollapsed && (
          <div className="text-center text-sm text-muted-foreground py-2">
            {columnTasks.length} completed tasks
          </div>
        )}
      </Card>
    </div>
  );
}
