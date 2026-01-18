'use client';

import { useEffect, useState } from 'react';
import { TerminalGrid } from '@/components/terminal/terminal-grid';
import { InvokeClaudeModal } from '@/components/terminal/invoke-claude-modal';
import { Button } from '@/components/ui/button';
import { Plus, Terminal as TerminalIcon } from 'lucide-react';
import { toast } from 'sonner';

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

interface Project {
  id: string;
  name: string;
  targetPath: string;
}

export default function TerminalsPage() {
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [worktrees, setWorktrees] = useState<Worktree[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [sessionToken, setSessionToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [invokeModalOpen, setInvokeModalOpen] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);

  const maxTerminals = 12;

  useEffect(() => {
    // Get current project from localStorage or context
    const projectId = localStorage.getItem('selectedProjectId');
    if (projectId) {
      fetchProject(projectId);
      fetchTerminals(projectId);
      fetchWorktrees(projectId);
    }

    // Get session token (simplified - in production, get from auth session)
    const token = Math.random().toString(36).substring(7);
    setSessionToken(token);

    return () => {
      if (ws) {
        ws.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProject = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data);
      }
    } catch (error) {
      console.error('Failed to fetch project:', error);
      toast.error('Failed to load project');
    }
  };

  const fetchTerminals = async (projectId: string) => {
    try {
      const response = await fetch(`/api/terminals?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setTerminals(data);
      }
    } catch (error) {
      console.error('Failed to fetch terminals:', error);
      toast.error('Failed to load terminals');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWorktrees = async (projectId: string) => {
    try {
      const response = await fetch(`/api/worktrees?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setWorktrees(data);
      }
    } catch (error) {
      console.error('Failed to fetch worktrees:', error);
    }
  };

  const handleCreateTerminal = async () => {
    if (!project) {
      toast.error('No project selected');
      return;
    }

    if (terminals.length >= maxTerminals) {
      toast.error(`Maximum ${maxTerminals} terminals allowed`);
      return;
    }

    try {
      const response = await fetch('/api/terminals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Terminal ${terminals.length + 1}`,
          projectId: project.id,
        }),
      });

      if (response.ok) {
        const newTerminal = await response.json();
        setTerminals([...terminals, newTerminal]);
        toast.success('Terminal created');
      } else {
        toast.error('Failed to create terminal');
      }
    } catch (error) {
      console.error('Failed to create terminal:', error);
      toast.error('Failed to create terminal');
    }
  };

  const handleCloseTerminal = async (id: string) => {
    try {
      const response = await fetch(`/api/terminals/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTerminals(terminals.filter((t) => t.id !== id));
        toast.success('Terminal closed');
      } else {
        toast.error('Failed to close terminal');
      }
    } catch (error) {
      console.error('Failed to close terminal:', error);
      toast.error('Failed to close terminal');
    }
  };

  const handleInvokeAll = async (command: string) => {
    if (!project) return;

    // Setup WebSocket if not already connected
    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/terminal?token=${sessionToken}`;
    const socket = ws || new WebSocket(wsUrl);

    if (!ws) {
      setWs(socket);

      socket.onopen = () => {
        socket.send(
          JSON.stringify({
            type: 'broadcast',
            projectId: project.id,
            data: command + '\n',
          })
        );
        toast.success(`Command sent to ${terminals.length} terminals`);
      };

      socket.onerror = () => {
        toast.error('Failed to connect to WebSocket');
      };
    } else {
      socket.send(
        JSON.stringify({
          type: 'broadcast',
          projectId: project.id,
          data: command + '\n',
        })
      );
      toast.success(`Command sent to ${terminals.length} terminals`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading terminals...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No project selected</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Please select a project from the header
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Controls bar */}
      <div className="flex items-center justify-between border-b bg-muted/30 px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <TerminalIcon className="h-5 w-5" />
            <h1 className="text-lg font-semibold">Agent Terminals</h1>
          </div>
          <div className="text-sm text-muted-foreground">
            {terminals.length} / {maxTerminals} terminals
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setInvokeModalOpen(true)}
            disabled={terminals.length === 0}
          >
            Invoke Claude All
          </Button>
          <Button
            onClick={handleCreateTerminal}
            disabled={terminals.length >= maxTerminals}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Terminal
          </Button>
        </div>
      </div>

      {/* Terminal grid */}
      <div className="flex-1 overflow-hidden p-6">
        {terminals.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <TerminalIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No terminals</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create a new terminal to get started
              </p>
              <Button onClick={handleCreateTerminal} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                New Terminal
              </Button>
            </div>
          </div>
        ) : (
          <TerminalGrid
            terminals={terminals}
            worktrees={worktrees}
            projectPath={project.targetPath || '/'}
            projectId={project.id}
            sessionToken={sessionToken}
            onCloseTerminal={handleCloseTerminal}
          />
        )}
      </div>

      {/* Invoke Claude All modal */}
      <InvokeClaudeModal
        open={invokeModalOpen}
        onOpenChange={setInvokeModalOpen}
        terminalCount={terminals.length}
        onInvoke={handleInvokeAll}
      />
    </div>
  );
}
