'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Feature } from '@/types/roadmap';

interface FeatureItemProps {
  feature: Feature;
  onBuild?: (feature: Feature) => void;
}

export function FeatureItem({ feature, onBuild }: FeatureItemProps) {
  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'MUST':
        return {
          label: 'Must',
          className: 'bg-red-500/10 text-red-500 border-red-500/20',
        };
      case 'SHOULD':
        return {
          label: 'Should',
          className: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
        };
      case 'COULD':
        return {
          label: 'Could',
          className: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        };
      case 'WONT':
        return {
          label: "Won't",
          className: 'bg-muted text-muted-foreground',
        };
      default:
        return {
          label: priority,
          className: 'bg-muted text-muted-foreground',
        };
    }
  };

  const priorityConfig = getPriorityConfig(feature.priority);

  return (
    <div className="flex items-center justify-between py-2 group">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Badge variant="outline" className={priorityConfig.className}>
          {priorityConfig.label}
        </Badge>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{feature.title}</p>
          {feature.description && (
            <p className="text-sm text-muted-foreground truncate">
              {feature.description}
            </p>
          )}
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onBuild?.(feature)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-cyan-400 active:text-cyan-400"
      >
        Build
      </Button>
    </div>
  );
}
