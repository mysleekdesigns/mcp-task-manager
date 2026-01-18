'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { FeatureItem } from './FeatureItem';
import type { Phase, Feature } from '@/types/roadmap';

interface PhaseCardProps {
  phase: Phase;
  onBuildFeature?: (feature: Feature) => void;
  onToggleMilestone?: (milestoneId: string, completed: boolean) => void;
}

export function PhaseCard({ phase, onBuildFeature, onToggleMilestone }: PhaseCardProps) {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'planned':
        return {
          label: 'Planned',
          className: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        };
      case 'active':
        return {
          label: 'Active',
          className: 'bg-green-500/10 text-green-500 border-green-500/20',
        };
      case 'completed':
        return {
          label: 'Completed',
          className: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
        };
      default:
        return {
          label: status,
          className: 'bg-muted text-muted-foreground',
        };
    }
  };

  const statusConfig = getStatusConfig(phase.status);

  const completedMilestones = phase.milestones.filter(m => m.completed).length;
  const totalMilestones = phase.milestones.length;
  const progress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
              {phase.order}
            </div>
            <CardTitle>{phase.name}</CardTitle>
          </div>
          <Badge variant="outline" className={statusConfig.className}>
            {statusConfig.label}
          </Badge>
        </div>
        {phase.description && (
          <CardDescription>{phase.description}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Milestones Section */}
        {phase.milestones.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold">Milestones</h4>
              <span className="text-sm text-muted-foreground">
                {completedMilestones}/{totalMilestones}
              </span>
            </div>
            <Progress value={progress} className="h-2 mb-3" />
            <div className="space-y-2">
              {phase.milestones.map((milestone) => (
                <div key={milestone.id} className="flex items-center gap-2">
                  <Checkbox
                    id={milestone.id}
                    checked={milestone.completed}
                    onCheckedChange={(checked) =>
                      onToggleMilestone?.(milestone.id, checked as boolean)
                    }
                  />
                  <label
                    htmlFor={milestone.id}
                    className={`text-sm cursor-pointer ${
                      milestone.completed ? 'line-through text-muted-foreground' : ''
                    }`}
                  >
                    {milestone.title}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Features Section */}
        {phase.features.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-3">
              Features ({phase.features.length})
            </h4>
            <div className="space-y-1">
              {phase.features.map((feature) => (
                <FeatureItem
                  key={feature.id}
                  feature={feature}
                  onBuild={onBuildFeature}
                />
              ))}
            </div>
          </div>
        )}

        {phase.features.length === 0 && phase.milestones.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No features or milestones yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}
