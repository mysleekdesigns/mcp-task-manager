'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Branch {
  name: string;
  current: boolean;
}

interface WorktreeFormProps {
  projectId: string;
  projectPath?: string;
  onWorktreeCreated: () => void;
}

export function WorktreeForm({
  projectId,
  projectPath,
  onWorktreeCreated,
}: WorktreeFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    branch: '',
    path: '',
  });

  const fetchBranches = async () => {
    setLoadingBranches(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/branches`);
      if (!response.ok) {
        throw new Error('Failed to fetch branches');
      }
      const data = await response.json();
      setBranches(data);
    } catch (error) {
      toast.error('Failed to load branches');
      console.error(error);
    } finally {
      setLoadingBranches(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchBranches();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleBranchChange = (branch: string) => {
    const sanitizedBranch = branch.replace(/[^a-zA-Z0-9]/g, '-');
    setFormData((prev) => ({
      ...prev,
      branch,
      name: prev.name || `worktree-${sanitizedBranch}`,
      path:
        prev.path ||
        (projectPath
          ? `${projectPath}/../worktrees/${sanitizedBranch}`
          : ''),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/worktrees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          projectId,
          isMain: false,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create worktree');
      }

      toast.success('Worktree created successfully');
      setOpen(false);
      setFormData({ name: '', branch: '', path: '' });
      onWorktreeCreated();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create worktree'
      );
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    formData.name.trim() && formData.branch.trim() && formData.path.trim();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Worktree
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Worktree</DialogTitle>
            <DialogDescription>
              Create a new git worktree to work on a different branch simultaneously.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="branch">Branch</Label>
              <Select
                value={formData.branch}
                onValueChange={handleBranchChange}
                disabled={loadingBranches}
              >
                <SelectTrigger id="branch">
                  <SelectValue
                    placeholder={
                      loadingBranches ? 'Loading branches...' : 'Select a branch'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.name} value={branch.name}>
                      {branch.name}
                      {branch.current && ' (current)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="worktree-feature-branch"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="path">Path</Label>
              <Input
                id="path"
                value={formData.path}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, path: e.target.value }))
                }
                placeholder="/path/to/worktree"
                required
              />
              <p className="text-xs text-muted-foreground">
                Absolute path where the worktree will be created
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="text-muted-foreground hover:text-cyan-400 active:text-cyan-400"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isFormValid || loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Worktree
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
