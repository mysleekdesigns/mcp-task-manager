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
  onEdit?: (taskId: string) => void;
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
    transition,
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
      className="p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(task.id)}>
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
          <p className="text-xs text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.map((tag) => (
              <Badge
                key={tag}
                variant={getTagVariant(tag)}
                className="text-xs px-2 py-0"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Phase Progress */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{phaseProgress.completed}/{phaseProgress.total}</span>
          </div>
          <div className="flex gap-1">
            {task.phases.map((phase) => (
              <div
                key={phase.id}
                className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden"
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
          <div className="flex justify-between text-xs text-muted-foreground">
            {task.phases.map((phase) => (
              <span key={phase.id} className="capitalize">
                {phase.name.toLowerCase()}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <Badge variant={isRunning ? 'default' : 'secondary'} className="text-xs">
              {isRunning ? 'Running' : 'Pending'}
            </Badge>
            <span className="text-xs text-muted-foreground">
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
            className="h-7 px-2"
          >
            {isRunning ? (
              <>
                <Pause className="h-3 w-3 mr-1" />
                Stop
              </>
            ) : (
              <>
                <Play className="h-3 w-3 mr-1" />
                Start
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
      return 'bg-green-500';
    case 'RUNNING':
      return 'bg-blue-500';
    case 'FAILED':
      return 'bg-red-500';
    default:
      return 'bg-gray-300';
  }
}

function getPhaseProgress(phases: TaskPhase[]): { completed: number; total: number } {
  const completed = phases.filter((p) => p.status === 'COMPLETED').length;
  return { completed, total: phases.length };
}
