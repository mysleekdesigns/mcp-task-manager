'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { McpServerItem } from './McpServerItem';
import type { McpConfig, McpServerTemplate } from '@/types/mcp';

interface McpServerListProps {
  category: string;
  servers: McpServerTemplate[];
  configs: McpConfig[];
  onToggle: (serverId: string, enabled: boolean) => void;
}

export function McpServerList({ category, servers, configs, onToggle }: McpServerListProps) {
  const isServerEnabled = (serverId: string): boolean => {
    const config = configs.find(c => c.type === serverId);
    return config?.enabled ?? false;
  };

  if (servers.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{category}</CardTitle>
        <CardDescription>
          {servers.length} {servers.length === 1 ? 'server' : 'servers'} available
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {servers.map((server) => (
            <McpServerItem
              key={server.id}
              server={server}
              enabled={isServerEnabled(server.id)}
              onToggle={(enabled) => onToggle(server.id, enabled)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
