'use client';

import { useEffect, useState } from 'react';
import { RoadmapHeader } from '@/components/roadmap/RoadmapHeader';
import { RoadmapTabs } from '@/components/roadmap/RoadmapTabs';
import { PhaseCard } from '@/components/roadmap/PhaseCard';
import { AddFeatureDialog } from '@/components/roadmap/AddFeatureDialog';
import { AddPhaseDialog } from '@/components/roadmap/AddPhaseDialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import type { Phase, Feature } from '@/types/roadmap';

export default function RoadmapPage() {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [projectId] = useState('default-project'); // TODO: Get from context/params
  const [projectName] = useState('Claude Tasks'); // TODO: Get from API
  const [projectDescription] = useState('Next.js app for managing AI-driven development tasks'); // TODO: Get from API
  const [projectStatus] = useState('active'); // TODO: Get from API

  const fetchPhases = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/projects/${projectId}/phases`);
      // const data = await response.json();
      // setPhases(data);

      // Mock data for now
      setTimeout(() => {
        setPhases([
          {
            id: '1',
            name: 'Foundation',
            description: 'Core infrastructure and authentication',
            order: 1,
            status: 'completed',
            projectId,
            features: [
              {
                id: 'f1',
                title: 'User Authentication',
                description: 'Auth.js with GitHub and Google OAuth',
                priority: 'MUST',
                status: 'completed',
                projectId,
              },
              {
                id: 'f2',
                title: 'Database Schema',
                description: 'Prisma schema with all core models',
                priority: 'MUST',
                status: 'completed',
                projectId,
              },
            ],
            milestones: [
              { id: 'm1', title: 'Authentication working', completed: true, phaseId: '1' },
              { id: 'm2', title: 'Database migrations running', completed: true, phaseId: '1' },
            ],
          },
          {
            id: '2',
            name: 'Task Management',
            description: 'Kanban board and task workflows',
            order: 2,
            status: 'active',
            projectId,
            features: [
              {
                id: 'f3',
                title: 'Kanban Board',
                description: 'Drag and drop task management',
                priority: 'MUST',
                status: 'active',
                projectId,
              },
              {
                id: 'f4',
                title: 'Task Phases',
                description: 'Plan, Code, QA workflow',
                priority: 'SHOULD',
                status: 'active',
                projectId,
              },
            ],
            milestones: [
              { id: 'm3', title: 'Basic board layout', completed: true, phaseId: '2' },
              { id: 'm4', title: 'Drag and drop working', completed: false, phaseId: '2' },
              { id: 'm5', title: 'Task creation flow', completed: false, phaseId: '2' },
            ],
          },
          {
            id: '3',
            name: 'Terminal Integration',
            description: 'Multi-terminal management',
            order: 3,
            status: 'planned',
            projectId,
            features: [
              {
                id: 'f5',
                title: 'Terminal Grid',
                description: 'Resizable terminal panes',
                priority: 'MUST',
                status: 'planned',
                projectId,
              },
              {
                id: 'f6',
                title: 'Session Persistence',
                description: 'Save terminal state',
                priority: 'COULD',
                status: 'planned',
                projectId,
              },
            ],
            milestones: [
              { id: 'm6', title: 'xterm.js integration', completed: false, phaseId: '3' },
              { id: 'm7', title: 'WebSocket server', completed: false, phaseId: '3' },
            ],
          },
        ]);
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error('Failed to fetch phases:', error);
      toast.error('Failed to load roadmap');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPhases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleAddPhase = async (_data: { name: string; description: string }) => {
    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/projects/${projectId}/phases`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data),
      // });

      toast.success('Phase added successfully');
      fetchPhases();
    } catch (error) {
      console.error('Failed to add phase:', error);
      toast.error('Failed to add phase');
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleAddFeature = async (_data: {
    title: string;
    description: string;
    priority: string;
    phaseId?: string;
  }) => {
    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/projects/${projectId}/features`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ ..._data, projectId }),
      // });

      toast.success('Feature added successfully');
      fetchPhases();
    } catch (error) {
      console.error('Failed to add feature:', error);
      toast.error('Failed to add feature');
    }
  };

  const handleBuildFeature = (feature: Feature) => {
    toast.info(`Building task from feature: ${feature.title}`);
    // TODO: Implement task creation from feature
  };

  const handleToggleMilestone = async (milestoneId: string, completed: boolean) => {
    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/milestones/${milestoneId}`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ completed }),
      // });

      // Optimistic update
      setPhases(phases.map(phase => ({
        ...phase,
        milestones: phase.milestones.map(m =>
          m.id === milestoneId ? { ...m, completed } : m
        ),
      })));

      toast.success(completed ? 'Milestone completed' : 'Milestone reopened');
    } catch (error) {
      console.error('Failed to toggle milestone:', error);
      toast.error('Failed to update milestone');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex gap-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
        <div className="grid gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <RoadmapHeader
        projectName={projectName}
        description={projectDescription}
        status={projectStatus}
        phases={phases}
      />

      <div className="flex gap-2">
        <AddPhaseDialog projectId={projectId} onAdd={handleAddPhase} />
        <AddFeatureDialog phases={phases} projectId={projectId} onAdd={handleAddFeature} />
      </div>

      {phases.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No phases yet. Add your first phase to get started.</p>
          <AddPhaseDialog
            projectId={projectId}
            onAdd={handleAddPhase}
            trigger={<Button>Create First Phase</Button>}
          />
        </div>
      ) : (
        <RoadmapTabs phases={phases}>
          <div className="grid gap-6">
            {phases.map((phase) => (
              <PhaseCard
                key={phase.id}
                phase={phase}
                onBuildFeature={handleBuildFeature}
                onToggleMilestone={handleToggleMilestone}
              />
            ))}
          </div>
        </RoadmapTabs>
      )}
    </div>
  );
}
