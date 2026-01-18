'use client';

import { useState } from 'react';
import { TerminalPane } from './terminal-pane';

interface Terminal {
  id: string;
  name: string;
  status: string;
  pid: number | null;
  projectId: string;
  worktreeId: string | null;
  worktree?: {
    id: string;
    name: string;
    path: string;
    branch: string;
  };
}

interface Worktree {
  id: string;
  name: string;
  path: string;
  branch: string;
}

interface TerminalGridProps {
  terminals: Terminal[];
  worktrees: Worktree[];
  projectPath: string;
  projectId: string;
  sessionToken: string;
  onCloseTerminal: (id: string) => void;
  onWorktreeChange?: (terminalId: string, worktreeId: string) => void;
}

export function TerminalGrid({
  terminals,
  worktrees,
  projectPath,
  projectId,
  sessionToken,
  onCloseTerminal,
  onWorktreeChange,
}: TerminalGridProps) {
  const [expandedTerminal, setExpandedTerminal] = useState<string | null>(null);

  const handleExpand = (id: string) => {
    setExpandedTerminal(id);
  };

  const handleCollapse = () => {
    setExpandedTerminal(null);
  };

  // If a terminal is expanded, show only that terminal
  if (expandedTerminal) {
    const terminal = terminals.find((t) => t.id === expandedTerminal);
    if (terminal) {
      return (
        <div className="h-full w-full">
          <TerminalPane
            id={terminal.id}
            name={terminal.name}
            cwd={terminal.worktree?.path || projectPath}
            projectId={projectId}
            worktreeId={terminal.worktreeId || undefined}
            worktrees={worktrees}
            sessionToken={sessionToken}
            isExpanded={true}
            onClose={() => onCloseTerminal(terminal.id)}
            onExpand={() => handleExpand(terminal.id)}
            onCollapse={handleCollapse}
            onWorktreeChange={(worktreeId) =>
              onWorktreeChange?.(terminal.id, worktreeId)
            }
          />
        </div>
      );
    }
  }

  // Determine grid layout based on number of terminals
  const terminalCount = terminals.length;
  let gridClass = 'grid gap-4';

  if (terminalCount === 1) {
    gridClass += ' grid-cols-1 grid-rows-1';
  } else if (terminalCount === 2) {
    gridClass += ' grid-cols-2 grid-rows-1';
  } else if (terminalCount <= 4) {
    gridClass += ' grid-cols-2 grid-rows-2';
  } else if (terminalCount <= 6) {
    gridClass += ' grid-cols-3 grid-rows-2';
  } else if (terminalCount <= 9) {
    gridClass += ' grid-cols-3 grid-rows-3';
  } else {
    // For 10-12 terminals, use 3x4 grid
    gridClass += ' grid-cols-3 grid-rows-4';
  }

  return (
    <div className={`h-full w-full ${gridClass}`}>
      {terminals.map((terminal) => (
        <TerminalPane
          key={terminal.id}
          id={terminal.id}
          name={terminal.name}
          cwd={terminal.worktree?.path || projectPath}
          projectId={projectId}
          worktreeId={terminal.worktreeId || undefined}
          worktrees={worktrees}
          sessionToken={sessionToken}
          isExpanded={false}
          onClose={() => onCloseTerminal(terminal.id)}
          onExpand={() => handleExpand(terminal.id)}
          onCollapse={handleCollapse}
          onWorktreeChange={(worktreeId) =>
            onWorktreeChange?.(terminal.id, worktreeId)
          }
        />
      ))}
    </div>
  );
}
