'use client';

import { useState, useEffect } from 'react';
import { PrList } from '@/components/github/PrList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { GitPullRequest, RefreshCw, AlertCircle } from 'lucide-react';
import { GitHubPullRequest } from '@/components/github/types';

export default function GitHubPRsPage() {
  const [prs, setPrs] = useState<GitHubPullRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [owner, setOwner] = useState<string>('');
  const [repo, setRepo] = useState<string>('');
  const [projectName, setProjectName] = useState<string>('');

  const fetchPRs = async (ownerParam: string, repoParam: string) => {
    if (!ownerParam || !repoParam) {
      setError('Repository information not available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/github/prs?owner=${encodeURIComponent(ownerParam)}&repo=${encodeURIComponent(repoParam)}&state=all`
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || data.message || 'Failed to fetch pull requests');
      }

      const data = await response.json();
      setPrs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching PRs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch pull requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchProjectInfo = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/projects');

        if (!response.ok) {
          throw new Error('Failed to fetch project info');
        }

        const data = await response.json();
        // API returns array directly, not { projects: [...] }
        const projects = Array.isArray(data) ? data : [];

        if (projects.length === 0) {
          setError('No projects found. Create a project first.');
          setLoading(false);
          return;
        }

        // Get the selected project from localStorage (set by ProjectSelector)
        const currentProjectId = localStorage.getItem('currentProjectId');

        // Find the selected project, or fall back to first project
        let selectedProject = projects.find(
          (p: { id: string; githubRepo?: string; name: string }) => p.id === currentProjectId
        );

        // If no matching project found, use the first one
        if (!selectedProject) {
          selectedProject = projects[0];
        }

        setProjectName(selectedProject.name);

        if (!selectedProject.githubRepo) {
          setError(`No GitHub repository linked to project "${selectedProject.name}"`);
          setLoading(false);
          return;
        }

        // Parse GitHub repo (format: owner/repo or https://github.com/owner/repo)
        const repoUrl = selectedProject.githubRepo;
        const match = repoUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)/);

        if (match) {
          const [, ownerName, repoName] = match;
          setOwner(ownerName);
          setRepo(repoName);
          fetchPRs(ownerName, repoName);
        } else {
          // Try simple owner/repo format
          const parts = repoUrl.split('/');
          if (parts.length === 2) {
            setOwner(parts[0]);
            setRepo(parts[1]);
            fetchPRs(parts[0], parts[1]);
          } else {
            setError('Invalid GitHub repository format');
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('Error fetching project info:', err);
        setError('Failed to load project information');
        setLoading(false);
      }
    };

    fetchProjectInfo();
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <GitPullRequest className="h-8 w-8" />
            Pull Requests
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage and review GitHub pull requests
            {projectName && owner && repo && (
              <span className="block text-sm mt-1">
                Showing PRs from <span className="font-medium text-foreground">{owner}/{repo}</span> (Project: {projectName})
              </span>
            )}
          </p>
        </div>

        <Button
          onClick={() => fetchPRs(owner, repo)}
          disabled={loading || !owner || !repo}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Repository Pull Requests</CardTitle>
          <CardDescription>
            View and track all pull requests from your linked GitHub repository
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PrList prs={prs} loading={loading} error={error} />
        </CardContent>
      </Card>
    </div>
  );
}
