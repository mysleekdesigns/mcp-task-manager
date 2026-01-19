'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bot, CircleDot, CircleX, Loader2, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ClaudeStatus = 'launching' | 'active' | 'exited' | 'failed' | null;

interface ClaudeStatusIndicatorProps {
  status: ClaudeStatus;
  onRelaunch?: () => void;
  className?: string;
}

export function ClaudeStatusIndicator({
  status,
  onRelaunch,
  className,
}: ClaudeStatusIndicatorProps) {
  if (!status) {
    return null;
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'launching':
        return {
          icon: Loader2,
          label: 'Launching Claude',
          variant: 'secondary' as const,
          iconClass: 'animate-spin text-blue-500',
          showRelaunch: false,
        };
      case 'active':
        return {
          icon: CircleDot,
          label: 'Claude Active',
          variant: 'default' as const,
          iconClass: 'text-green-500 animate-pulse',
          showRelaunch: false,
        };
      case 'exited':
        return {
          icon: CircleX,
          label: 'Claude Exited',
          variant: 'outline' as const,
          iconClass: 'text-yellow-500',
          showRelaunch: true,
        };
      case 'failed':
        return {
          icon: CircleX,
          label: 'Claude Failed',
          variant: 'destructive' as const,
          iconClass: 'text-red-500',
          showRelaunch: true,
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Badge variant={config.variant} className="flex items-center gap-1.5 px-2">
        <Icon className={cn('h-3 w-3', config.iconClass)} />
        <span className="text-xs">{config.label}</span>
      </Badge>

      {config.showRelaunch && onRelaunch && (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 gap-1.5 px-2"
          onClick={onRelaunch}
        >
          <RotateCw className="h-3 w-3" />
          <span className="text-xs">Re-launch</span>
        </Button>
      )}
    </div>
  );
}
