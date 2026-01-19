'use client';

import { useState, useEffect } from 'react';
import { GitHubIssue, IssueFilter } from '@/types/github';
import { IssueCard } from './IssueCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GitBranch, Filter } from 'lucide-react';
import { toast } from 'sonner';

interface IssuesListProps {
  projectId: string;
  githubRepo?: string | null;
  onViewDetails: (issue: GitHubIssue) => void;
  onCreateTask: (issue: GitHubIssue) => void;
}

export function IssuesList({ projectId, githubRepo, onViewDetails, onCreateTask }: IssuesListProps) {
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<IssueFilter>('open');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!githubRepo) {
      setLoading(false);
      return;
    }

    const fetchIssues = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/github/issues?projectId=${projectId}&state=${filter}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch issues');
        }

        const data = await response.json();
        setIssues(data.issues || []);
      } catch (err) {
        console.error('Error fetching issues:', err);
        const message = err instanceof Error ? err.message : 'Failed to load issues';
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
  }, [projectId, githubRepo, filter]);

  if (!githubRepo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No GitHub Repository Linked</CardTitle>
          <CardDescription>
            Link a GitHub repository to your project to view and manage issues.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Go to project settings to configure your GitHub repository URL.
          </p>
          <Button variant="outline" onClick={() => window.location.href = '/dashboard/settings'} className="text-muted-foreground hover:text-cyan-400 active:text-cyan-400">
            Go to Settings
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Issues</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => window.location.reload()} className="text-muted-foreground hover:text-cyan-400 active:text-cyan-400">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex gap-2">
            <Badge
              variant={filter === 'all' ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-primary/10 transition-colors"
              onClick={() => setFilter('all')}
            >
              All
            </Badge>
            <Badge
              variant={filter === 'open' ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-primary/10 transition-colors"
              onClick={() => setFilter('open')}
            >
              Open
            </Badge>
            <Badge
              variant={filter === 'closed' ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-primary/10 transition-colors"
              onClick={() => setFilter('closed')}
            >
              Closed
            </Badge>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {loading ? 'Loading...' : `${issues.length} ${issues.length === 1 ? 'issue' : 'issues'}`}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="space-y-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-3/4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && issues.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <GitBranch className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No {filter !== 'all' ? filter : ''} issues found</p>
            <p className="text-sm text-muted-foreground mt-2">
              {filter === 'open'
                ? 'All issues have been closed or there are no issues yet.'
                : 'There are no issues in this repository.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Issues List */}
      {!loading && issues.length > 0 && (
        <div className="space-y-3">
          {issues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onViewDetails={onViewDetails}
              onCreateTask={onCreateTask}
            />
          ))}
        </div>
      )}
    </div>
  );
}
