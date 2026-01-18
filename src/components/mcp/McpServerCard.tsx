'use client';

import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Settings, Trash2, Box } from 'lucide-react';
import type { McpConfig } from '@/types/mcp';

interface McpServerCardProps {
  config: McpConfig;
  onToggle: (enabled: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function McpServerCard({ config, onToggle, onEdit, onDelete }: McpServerCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0">
            <Box className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm truncate">{config.name}</h4>
            <p className="text-sm text-muted-foreground truncate">
              Type: {config.type}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="h-8 w-8"
            aria-label={`Edit ${config.name}`}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-8 w-8 text-destructive hover:text-destructive"
            aria-label={`Delete ${config.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Switch
            checked={config.enabled}
            onCheckedChange={onToggle}
            aria-label={`Toggle ${config.name}`}
          />
        </div>
      </div>
    </Card>
  );
}
