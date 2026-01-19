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
  const [status, setStatus] = useState<'idle' | 'running' | 'exited'>('idle');
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

  return (
    <div className="flex h-full flex-col rounded-lg border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-muted/30 px-3 py-2">
        <div className="flex items-center gap-2">
          {/* Status indicator */}
          <div
            className={`h-2 w-2 rounded-full ${
              status === 'running'
                ? 'bg-green-500'
                : status === 'exited'
                  ? 'bg-red-500'
                  : 'bg-yellow-500'
            }`}
            title={status}
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
        />
      </div>
    </div>
  );
}
