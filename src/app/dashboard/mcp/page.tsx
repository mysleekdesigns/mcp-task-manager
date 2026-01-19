'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { McpServerList } from '@/components/mcp/McpServerList';
import { McpServerCard } from '@/components/mcp/McpServerCard';
import { AddServerModal } from '@/components/mcp/AddServerModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import type { McpConfig, McpServerTemplate } from '@/types/mcp';
import { MCP_SERVER_TEMPLATES } from '@/types/mcp';

export default function McpPage() {
  const [configs, setConfigs] = useState<McpConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [projectId] = useState('default-project'); // TODO: Get from context/params
  const [projectName] = useState('Claude Tasks'); // TODO: Get from API
  const [projectDescription] = useState('Next.js app for managing AI-driven development tasks'); // TODO: Get from API
  const [editConfig, setEditConfig] = useState<McpConfig | null>(null);
  const [deleteConfig, setDeleteConfig] = useState<McpConfig | null>(null);

  const fetchConfigs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/mcp?projectId=${projectId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch MCP configs');
      }

      const data = await response.json();
      setConfigs(data || []);
    } catch (error) {
      console.error('Failed to fetch MCP configs:', error);
      toast.error('Failed to load MCP configurations');
      setConfigs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleToggleTemplate = async (serverId: string, enabled: boolean) => {
    try {
      const existingConfig = configs.find(c => c.type === serverId);

      if (existingConfig) {
        // Update existing config
        const response = await fetch(`/api/mcp/${existingConfig.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled }),
        });

        if (!response.ok) {
          throw new Error('Failed to update MCP config');
        }

        const updated = await response.json();
        setConfigs(configs.map(c => c.id === updated.id ? updated : c));
        toast.success(`${enabled ? 'Enabled' : 'Disabled'} ${existingConfig.name}`);
      } else {
        // Create new config for template
        const template = MCP_SERVER_TEMPLATES.find(t => t.id === serverId);
        if (!template) return;

        const response = await fetch('/api/mcp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            name: template.name,
            type: template.id,
            enabled,
            config: template.defaultConfig || null,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create MCP config');
        }

        const newConfig = await response.json();
        setConfigs([...configs, newConfig]);
        toast.success(`Enabled ${template.name}`);
      }
    } catch (error) {
      console.error('Failed to toggle server:', error);
      toast.error('Failed to update server configuration');
    }
  };

  const handleToggleCustom = async (configId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/mcp/${configId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });

      if (!response.ok) {
        throw new Error('Failed to update MCP config');
      }

      const updated = await response.json();
      setConfigs(configs.map(c => c.id === updated.id ? updated : c));
      toast.success(`${enabled ? 'Enabled' : 'Disabled'} ${updated.name}`);
    } catch (error) {
      console.error('Failed to toggle server:', error);
      toast.error('Failed to update server configuration');
    }
  };

  const handleSaveCustom = async (data: {
    name: string;
    type: string;
    config: Record<string, unknown> | null;
  }) => {
    try {
      if (editConfig) {
        // Update existing
        const response = await fetch(`/api/mcp/${editConfig.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error('Failed to update MCP config');
        }

        const updated = await response.json();
        setConfigs(configs.map(c => c.id === updated.id ? updated : c));
        toast.success('Server updated successfully');
        setEditConfig(null);
      } else {
        // Create new
        const response = await fetch('/api/mcp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            ...data,
            enabled: false,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create MCP config');
        }

        const newConfig = await response.json();
        setConfigs([...configs, newConfig]);
        toast.success('Server added successfully');
      }
    } catch (error) {
      console.error('Failed to save server:', error);
      toast.error('Failed to save server configuration');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfig) return;

    try {
      const response = await fetch(`/api/mcp/${deleteConfig.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete MCP config');
      }

      setConfigs(configs.filter(c => c.id !== deleteConfig.id));
      toast.success('Server deleted successfully');
      setDeleteConfig(null);
    } catch (error) {
      console.error('Failed to delete server:', error);
      toast.error('Failed to delete server configuration');
    }
  };

  // Group servers by category
  const serversByCategory = MCP_SERVER_TEMPLATES.reduce((acc, server) => {
    if (!acc[server.category]) {
      acc[server.category] = [];
    }
    acc[server.category].push(server);
    return acc;
  }, {} as Record<string, McpServerTemplate[]>);

  // Get custom servers (not in templates)
  const templateTypes = MCP_SERVER_TEMPLATES.map(t => t.id);
  const customConfigs = configs.filter(c => !templateTypes.includes(c.type));

  const enabledCount = configs.filter(c => c.enabled).length;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex gap-4">
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
        <div className="grid gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{projectName}</h1>
        <p className="text-muted-foreground mt-2">
          {projectDescription}
        </p>
        <div className="flex items-center gap-2 mt-3">
          <Badge variant="outline" className="gap-1">
            <span className="font-semibold">{enabledCount}</span> enabled
          </Badge>
          <Badge variant="outline" className="gap-1">
            <span className="font-semibold">{configs.length}</span> total servers
          </Badge>
        </div>
      </div>

      {/* MCP Server Categories */}
      <div className="space-y-6">
        {Object.entries(serversByCategory).map(([category, servers]) => (
          <McpServerList
            key={category}
            category={category}
            servers={servers}
            configs={configs}
            onToggle={handleToggleTemplate}
          />
        ))}
      </div>

      {/* Custom Servers */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Custom Servers</CardTitle>
              <CardDescription>
                Custom MCP server configurations
              </CardDescription>
            </div>
            <AddServerModal
              projectId={projectId}
              editConfig={editConfig}
              onSave={handleSaveCustom}
            />
          </div>
        </CardHeader>
        <CardContent>
          {customConfigs.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground mb-4">
                No custom servers configured yet
              </p>
              <AddServerModal
                projectId={projectId}
                editConfig={editConfig}
                onSave={handleSaveCustom}
              />
            </div>
          ) : (
            <div className="space-y-2">
              {customConfigs.map((config) => (
                <McpServerCard
                  key={config.id}
                  config={config}
                  onToggle={(enabled) => handleToggleCustom(config.id, enabled)}
                  onEdit={() => setEditConfig(config)}
                  onDelete={() => setDeleteConfig(config)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfig} onOpenChange={() => setDeleteConfig(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Server Configuration?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteConfig?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Modal */}
      {editConfig && (
        <AddServerModal
          projectId={projectId}
          editConfig={editConfig}
          onSave={handleSaveCustom}
          trigger={<div />}
        />
      )}
    </div>
  );
}
