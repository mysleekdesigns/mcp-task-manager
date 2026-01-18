'use client';

import { useEffect, useState } from 'react';
import { WorktreeList, WorktreeForm } from '@/components/worktree';
import { toast } from 'sonner';

interface Worktree {
  id: string;
  name: string;
  path: string;
  branch: string;
  isMain: boolean;
  _count?: {
    terminals: number;
  };
}

export default function WorktreesPage() {
  const [worktrees, setWorktrees] = useState<Worktree[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectPath, setProjectPath] = useState<string | null>(null);

  useEffect(() => {
    // Get current project from localStorage or context
    const storedProjectId = localStorage.getItem('currentProjectId');
    if (storedProjectId) {
      setProjectId(storedProjectId);
      fetchProjectDetails(storedProjectId);
      fetchWorktrees(storedProjectId);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProjectDetails = async (id: string) => {
    try {
      const response = await fetch(`/api/projects/${id}`);
      if (response.ok) {
        const project = await response.json();
        setProjectPath(project.targetPath);
      }
    } catch (error) {
      console.error('Failed to fetch project details:', error);
    }
  };

  const fetchWorktrees = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/worktrees?projectId=${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch worktrees');
      }
      const data = await response.json();
      setWorktrees(data);
    } catch (error) {
      toast.error('Failed to load worktrees');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleWorktreeCreated = () => {
    if (projectId) {
      fetchWorktrees(projectId);
    }
  };

  const handleWorktreeDeleted = () => {
    if (projectId) {
      fetchWorktrees(projectId);
    }
  };

  if (!projectId) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Worktrees</h1>
        <p className="text-muted-foreground mt-2">
          Please select a project first to manage worktrees.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Worktrees</h1>
          <p className="text-muted-foreground mt-2">
            Manage git worktrees for parallel development on different branches.
          </p>
        </div>
        <WorktreeForm
          projectId={projectId}
          projectPath={projectPath || undefined}
          onWorktreeCreated={handleWorktreeCreated}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading worktrees...</div>
        </div>
      ) : (
        <WorktreeList
          worktrees={worktrees}
          onWorktreeDeleted={handleWorktreeDeleted}
        />
      )}
    </div>
  );
}
