'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2, GitBranch, FolderOpen, Terminal } from 'lucide-react';
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

interface WorktreeListProps {
  worktrees: Worktree[];
  onWorktreeDeleted: () => void;
}

export function WorktreeList({ worktrees, onWorktreeDeleted }: WorktreeListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const response = await fetch(`/api/worktrees/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete worktree');
      }

      toast.success('Worktree deleted successfully');
      onWorktreeDeleted();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete worktree'
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (worktrees.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-muted-foreground">No worktrees found. Create one to get started.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {worktrees.map((worktree) => (
        <Card key={worktree.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{worktree.name}</CardTitle>
                  {worktree.isMain && (
                    <Badge variant="secondary" className="text-xs">
                      Main
                    </Badge>
                  )}
                </div>
                <CardDescription className="mt-1 flex items-center gap-1 text-xs">
                  <GitBranch className="h-3 w-3" />
                  {worktree.branch}
                </CardDescription>
              </div>
              {!worktree.isMain && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      disabled={deletingId === worktree.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Worktree</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete &quot;{worktree.name}&quot;? This action
                        cannot be undone.
                        {worktree._count && worktree._count.terminals > 0 && (
                          <span className="mt-2 block text-destructive">
                            Warning: This worktree has {worktree._count.terminals} active
                            terminal(s).
                          </span>
                        )}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(worktree.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <FolderOpen className="mt-0.5 h-4 w-4 shrink-0" />
              <code className="break-all text-xs">{worktree.path}</code>
            </div>
            {worktree._count && worktree._count.terminals > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Terminal className="h-4 w-4" />
                <span>{worktree._count.terminals} terminal(s)</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
