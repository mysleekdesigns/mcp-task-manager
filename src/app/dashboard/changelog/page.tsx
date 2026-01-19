'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChangelogTimeline } from '@/components/changelog/ChangelogTimeline';
import { AddChangelogEntryDialog } from '@/components/changelog/AddChangelogEntryDialog';
import { GenerateChangelogDialog } from '@/components/changelog/GenerateChangelogDialog';
import { ChangelogGroupedByDate, ChangelogGroupedByVersion, ChangelogType } from '@/types/changelog';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Filter } from 'lucide-react';

interface Project {
  id: string;
  name: string;
}

export default function ChangelogPage() {
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get('projectId');

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>(initialProjectId || '');
  const [groupBy, setGroupBy] = useState<'date' | 'version'>('date');
  const [filterType, setFilterType] = useState<ChangelogType | 'all'>('all');
  const [groupedByDate, setGroupedByDate] = useState<ChangelogGroupedByDate[]>([]);
  const [groupedByVersion, setGroupedByVersion] = useState<ChangelogGroupedByVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEntries, setLoadingEntries] = useState(false);

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        if (!response.ok) throw new Error('Failed to fetch projects');
        const data = await response.json();
        setProjects(data);

        // Auto-select first project if none selected
        if (!selectedProject && data.length > 0) {
          setSelectedProject(data[0].id);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [selectedProject]);

  // Fetch changelog entries
  useEffect(() => {
    if (!selectedProject) {
      setGroupedByDate([]);
      setGroupedByVersion([]);
      return;
    }

    const fetchChangelog = async () => {
      setLoadingEntries(true);
      try {
        const params = new URLSearchParams({
          projectId: selectedProject,
          groupBy,
        });

        if (filterType !== 'all') {
          params.append('type', filterType);
        }

        const response = await fetch(`/api/changelog?${params}`);
        if (!response.ok) throw new Error('Failed to fetch changelog');
        const data = await response.json();

        if (data.grouped) {
          if (groupBy === 'date') {
            setGroupedByDate(data.grouped);
            setGroupedByVersion([]);
          } else {
            setGroupedByVersion(data.grouped);
            setGroupedByDate([]);
          }
        }
      } catch (error) {
        console.error('Error fetching changelog:', error);
      } finally {
        setLoadingEntries(false);
      }
    };

    fetchChangelog();
  }, [selectedProject, groupBy, filterType]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Changelog</h1>
        </div>
        <p className="text-muted-foreground">
          Track project changes and milestones
        </p>
      </div>

      {/* Project Selector & Actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 flex-1 min-w-[200px]">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedProject && (
          <div className="flex items-center gap-2">
            <GenerateChangelogDialog projectId={selectedProject} />
            <AddChangelogEntryDialog projectId={selectedProject} />
          </div>
        )}
      </div>

      {selectedProject ? (
        <>
          {/* Filters & View Options */}
          <div className="flex items-center gap-4 flex-wrap">
            <Tabs value={groupBy} onValueChange={(v) => setGroupBy(v as 'date' | 'version')}>
              <TabsList>
                <TabsTrigger value="date">By Date</TabsTrigger>
                <TabsTrigger value="version">By Version</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterType} onValueChange={(v) => setFilterType(v as ChangelogType | 'all')}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="FEATURE">Features</SelectItem>
                  <SelectItem value="FIX">Fixes</SelectItem>
                  <SelectItem value="IMPROVEMENT">Improvements</SelectItem>
                  <SelectItem value="BREAKING">Breaking</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Timeline */}
          {loadingEntries ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <ChangelogTimeline
              groups={groupBy === 'date' ? groupedByDate : groupedByVersion}
              showProject={false}
            />
          )}
        </>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Select a project to view its changelog</p>
        </div>
      )}
    </div>
  );
}
