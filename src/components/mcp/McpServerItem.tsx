'use client';

import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import {
  FileText,
  Brain,
  Network,
  Box,
  Github,
  Globe,
  Chrome,
  Wrench,
  LucideIcon,
} from 'lucide-react';
import type { McpServerTemplate } from '@/types/mcp';

interface McpServerItemProps {
  server: McpServerTemplate;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

const iconMap: Record<string, LucideIcon> = {
  FileText,
  Brain,
  Network,
  Box,
  Github,
  Globe,
  Chrome,
  Wrench,
};

export function McpServerItem({ server, enabled, onToggle }: McpServerItemProps) {
  const Icon = server.icon ? iconMap[server.icon] : Box;

  return (
    <Card className="p-4 hover:bg-accent/50 transition-colors">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0">
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm truncate">{server.name}</h4>
            <p className="text-sm text-muted-foreground truncate">
              {server.description}
            </p>
          </div>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={onToggle}
          aria-label={`Toggle ${server.name}`}
        />
      </div>
    </Card>
  );
}
