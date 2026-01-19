'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Play, Pause } from 'lucide-react';
import { formatDistanceToNow } from '@/lib/utils';

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

interface TaskCardProps {
  task: Task;
  onStart?: (taskId: string) => void;
  onStop?: (taskId: string) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

export function TaskCard({ task, onStart, onStop, onEdit, onDelete }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isRunning = task.phases.some((phase) => phase.status === 'RUNNING');
  const phaseProgress = getPhaseProgress(task.phases);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`w-full p-3 md:p-4 cursor-grab active:cursor-grabbing hover:shadow-md ${!isDragging ? 'transition-shadow' : ''}`}
    >
      <div className="w-full space-y-2 md:space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm md:text-base font-semibold line-clamp-2 break-words flex-1 min-w-0">{task.title}</h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 md:h-6 md:w-6 flex-shrink-0 text-muted-foreground hover:text-cyan-400 active:text-cyan-400">
                <MoreVertical className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  Edit
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => {}}>
                View Details
              </DropdownMenuItem>
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(task.id)}
                  className="text-destructive"
                >
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Description Preview */}
        {task.description && (
          <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 break-words">
            {task.description}
          </p>
        )}

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 md:gap-2">
            {task.tags.map((tag) => (
              <Badge
                key={tag}
                variant={getTagVariant(tag)}
                className="text-[10px] md:text-xs px-1.5 md:px-2 py-0"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Phase Progress */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] md:text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{phaseProgress.completed}/{phaseProgress.total}</span>
          </div>
          <div className="flex gap-1">
            {task.phases.map((phase) => (
              <div
                key={phase.id}
                className="flex-1 h-1 md:h-1.5 rounded-full bg-muted overflow-hidden"
              >
                <div
                  className={`h-full ${getPhaseColor(phase.status)}`}
                  style={{
                    width:
                      phase.status === 'COMPLETED'
                        ? '100%'
                        : phase.status === 'RUNNING'
                        ? '50%'
                        : '0%',
                  }}
                />
              </div>
            ))}
          </div>
          <div className="hidden md:flex justify-between text-xs text-muted-foreground">
            {task.phases.map((phase) => (
              <span key={phase.id} className="capitalize">
                {phase.name.toLowerCase()}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t">
          <div className="flex items-center gap-1 md:gap-2 flex-wrap">
            <Badge variant={isRunning ? 'default' : 'secondary'} className="text-[10px] md:text-xs px-1.5 md:px-2 whitespace-nowrap">
              {isRunning ? 'Running' : 'Pending'}
            </Badge>
            <span className="text-[10px] md:text-xs text-muted-foreground hidden sm:inline whitespace-nowrap">
              {formatDistanceToNow(new Date(task.createdAt))}
            </span>
          </div>

          {/* Start/Stop Button */}
          <Button
            size="sm"
            variant={isRunning ? 'destructive' : 'default'}
            onClick={(e) => {
              e.stopPropagation();
              if (isRunning && onStop) {
                onStop(task.id);
              } else if (!isRunning && onStart) {
                onStart(task.id);
              }
            }}
            className="h-8 md:h-7 px-2 md:px-3 min-w-[44px] flex-shrink-0"
          >
            {isRunning ? (
              <>
                <Pause className="h-3.5 w-3.5 md:h-3 md:w-3 md:mr-1" />
                <span className="hidden md:inline">Stop</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 md:h-3 md:w-3 md:mr-1" />
                <span className="hidden md:inline">Start</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function getTagVariant(tag: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const lowercaseTag = tag.toLowerCase();
  if (lowercaseTag.includes('bug')) return 'destructive';
  if (lowercaseTag.includes('feature')) return 'default';
  if (lowercaseTag.includes('trivial')) return 'secondary';
  return 'outline';
}

function getPhaseColor(status: string): string {
  switch (status) {
    case 'COMPLETED':
      return 'bg-green-500 dark:bg-green-600';
    case 'RUNNING':
      return 'bg-primary dark:bg-primary/80';
    case 'FAILED':
      return 'bg-destructive dark:bg-destructive/80';
    default:
      return 'bg-muted-foreground/20 dark:bg-muted-foreground/30';
  }
}

function getPhaseProgress(phases: TaskPhase[]): { completed: number; total: number } {
  const completed = phases.filter((p) => p.status === 'COMPLETED').length;
  return { completed, total: phases.length };
}
