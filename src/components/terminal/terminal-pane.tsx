'use client';

import { useState } from 'react';
import { XTermWrapper } from './xterm-wrapper';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X, Maximize2, Minimize2 } from 'lucide-react';

interface Worktree {
  id: string;
  name: string;
  path: string;
  branch: string;
}

interface TerminalPaneProps {
  id: string;
  name: string;
  cwd: string;
  projectId: string;
  worktreeId?: string;
  worktrees: Worktree[];
  sessionToken: string;
  isExpanded?: boolean;
  onClose: () => void;
  onExpand?: () => void;
  onCollapse?: () => void;
  onWorktreeChange?: (worktreeId: string) => void;
}

export function TerminalPane({
  id,
  name,
  cwd,
  projectId,
  worktreeId,
  worktrees,
  sessionToken,
  isExpanded = false,
  onClose,
  onExpand,
  onCollapse,
  onWorktreeChange,
}: TerminalPaneProps) {
  const [status, setStatus] = useState<'connecting' | 'launching' | 'running' | 'exited' | 'error'>('connecting');
  const [selectedWorktree, setSelectedWorktree] = useState<string | undefined>(
    worktreeId
  );

  const handleWorktreeChange = (value: string) => {
    setSelectedWorktree(value);
    onWorktreeChange?.(value);
  };

  const currentCwd = selectedWorktree
    ? worktrees.find((w) => w.id === selectedWorktree)?.path || cwd
    : cwd;

  const getStatusColor = () => {
    switch (status) {
      case 'connecting':
      case 'launching':
        return 'bg-yellow-500 animate-pulse';
      case 'running':
        return 'bg-green-500';
      case 'exited':
        return 'bg-gray-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-yellow-500';
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'connecting':
        return 'Connecting to server...';
      case 'launching':
        return 'Launching terminal...';
      case 'running':
        return 'Running';
      case 'exited':
        return 'Process exited';
      case 'error':
        return 'Connection error';
      default:
        return status;
    }
  };

  return (
    <div className="glass flex h-full flex-col rounded-lg transition-all duration-200 hover:glow-sm focus-within:glow-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/20 bg-muted/20 px-3 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          {/* Status indicator */}
          <div
            className={`h-2 w-2 rounded-full ${getStatusColor()}`}
            title={getStatusTitle()}
          />
          <span className="text-sm font-medium">{name}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Worktree selector */}
          {worktrees.length > 0 && (
            <Select value={selectedWorktree} onValueChange={handleWorktreeChange}>
              <SelectTrigger size="sm" className="h-7 w-32">
                <SelectValue placeholder="Main" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Main</SelectItem>
                {worktrees.map((worktree) => (
                  <SelectItem key={worktree.id} value={worktree.id}>
                    {worktree.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Expand/Collapse button */}
          {onExpand && onCollapse && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={isExpanded ? onCollapse : onExpand}
            >
              {isExpanded ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          )}

          {/* Close button */}
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Terminal area */}
      <div className="flex-1 overflow-hidden p-2">
        <XTermWrapper
          terminalId={id}
          name={name}
          cwd={currentCwd}
          projectId={projectId}
          worktreeId={selectedWorktree}
          sessionToken={sessionToken}
          onReady={() => setStatus('running')}
          onExit={() => setStatus('exited')}
          autoFocus={isExpanded}
        />
      </div>
    </div>
  );
}
