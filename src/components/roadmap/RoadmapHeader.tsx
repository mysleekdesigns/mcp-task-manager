'use client';

import { Badge } from '@/components/ui/badge';
import type { Phase } from '@/types/roadmap';

interface RoadmapHeaderProps {
  projectName: string;
  description?: string;
  status: string;
  phases: Phase[];
}

export function RoadmapHeader({ projectName, description, status, phases }: RoadmapHeaderProps) {
  const allFeatures = phases.flatMap(phase => phase.features);

  const priorityCounts = {
    MUST: allFeatures.filter(f => f.priority === 'MUST').length,
    SHOULD: allFeatures.filter(f => f.priority === 'SHOULD').length,
    COULD: allFeatures.filter(f => f.priority === 'COULD').length,
    WONT: allFeatures.filter(f => f.priority === 'WONT').length,
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'planning':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'completed':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <div className="border-b pb-6">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-3xl font-bold">{projectName}</h1>
        <Badge variant="outline" className={getStatusColor(status)}>
          {status}
        </Badge>
      </div>

      {description && (
        <p className="text-muted-foreground mb-4">{description}</p>
      )}

      <div className="flex gap-6 text-sm">
        <div>
          <span className="text-muted-foreground">Features: </span>
          <span className="font-medium">{allFeatures.length}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Phases: </span>
          <span className="font-medium">{phases.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Priority:</span>
          <div className="flex gap-2">
            {priorityCounts.MUST > 0 && (
              <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                Must: {priorityCounts.MUST}
              </Badge>
            )}
            {priorityCounts.SHOULD > 0 && (
              <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                Should: {priorityCounts.SHOULD}
              </Badge>
            )}
            {priorityCounts.COULD > 0 && (
              <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                Could: {priorityCounts.COULD}
              </Badge>
            )}
            {priorityCounts.WONT > 0 && (
              <Badge variant="outline" className="bg-muted text-muted-foreground">
                Won&apos;t: {priorityCounts.WONT}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
