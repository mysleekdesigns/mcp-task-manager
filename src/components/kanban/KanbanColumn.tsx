'use client';

import type { TaskStatus, Priority } from '@/types';
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
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  tags: string[];
  phases: TaskPhase[];
  createdAt: Date;
  branchName: string | null;
}

interface Column {
  id: string;
  title: string;
  status: TaskStatus;
}

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onAddTask?: (status: TaskStatus) => void;
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
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: 'column',
      status: column.status,
    },
  });

  const columnTasks = tasks.filter((task) => task.status === column.status);

  return (
    <div className="w-full min-w-[250px] h-full">
      <Card className="p-2 md:p-3 h-full">
        {/* Column Header */}
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm md:text-base font-semibold">{column.title}</h3>
            <span className="text-xs text-muted-foreground bg-muted px-1.5 sm:px-2 py-0.5 rounded-full min-w-[20px] text-center">
              {columnTasks.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {column.status === 'COMPLETED' && onToggleCollapse && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCollapse}
                className="h-8 md:h-7 px-2 md:px-3 text-xs md:text-sm text-muted-foreground hover:text-cyan-400 active:text-cyan-400"
              >
                {isCollapsed ? 'Expand' : 'Collapse'}
              </Button>
            )}
            {onAddTask && !isCollapsed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAddTask(column.status)}
                className="h-8 w-8 md:h-7 md:w-auto md:px-2 p-0 md:p-2 text-muted-foreground hover:text-cyan-400 active:text-cyan-400"
                aria-label="Add task"
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
            className={`space-y-2 md:space-y-3 min-h-[250px] md:min-h-[400px] rounded-lg transition-colors ${
              isOver ? 'bg-accent/20 ring-2 ring-accent/50' : ''
            }`}
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
              <div className="flex flex-col items-center justify-center h-[100px] md:h-[200px] text-center text-muted-foreground">
                <p className="text-xs md:text-sm mb-2 md:mb-3">No tasks</p>
                {onAddTask && (
                  <Button
                    size="sm"
                    onClick={() => onAddTask(column.status)}
                    className="gap-2 h-9 md:h-8 px-3 md:px-4 text-sm bg-sidebar-primary hover:bg-sidebar-primary/90 text-slate-900"
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
          <div className="text-center text-xs md:text-sm text-muted-foreground py-2">
            {columnTasks.length} completed tasks
          </div>
        )}
      </Card>
    </div>
  );
}
