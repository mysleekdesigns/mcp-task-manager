'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { McpConfig } from '@/types/mcp';

interface AddServerModalProps {
  projectId: string;
  editConfig?: McpConfig | null;
  onSave: (data: {
    name: string;
    type: string;
    config: Record<string, unknown> | null;
  }) => void;
  trigger?: React.ReactNode;
}

export function AddServerModal({ editConfig, onSave, trigger }: AddServerModalProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [configJson, setConfigJson] = useState('{}');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    if (editConfig) {
      setName(editConfig.name);
      setType(editConfig.type);
      setConfigJson(JSON.stringify(editConfig.config || {}, null, 2));
    } else {
      setName('');
      setType('');
      setConfigJson('{}');
    }
    setJsonError(null);
  }, [editConfig, open]);

  const validateJson = (value: string): boolean => {
    try {
      JSON.parse(value);
      setJsonError(null);
      return true;
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : 'Invalid JSON');
      return false;
    }
  };

  const handleJsonChange = (value: string) => {
    setConfigJson(value);
    if (value.trim()) {
      validateJson(value);
    } else {
      setJsonError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !type.trim()) return;

    const isValidJson = validateJson(configJson);
    if (!isValidJson) return;

    setIsSubmitting(true);

    try {
      const config = configJson.trim() ? JSON.parse(configJson) : null;
      await onSave({
        name: name.trim(),
        type: type.trim(),
        config,
      });

      // Reset form
      setName('');
      setType('');
      setConfigJson('{}');
      setJsonError(null);
      setOpen(false);
    } catch (error) {
      console.error('Failed to save server config:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            + Add Custom Server
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {editConfig ? 'Edit Custom Server' : 'Add Custom Server'}
          </DialogTitle>
          <DialogDescription>
            Configure a custom MCP server with connection details and settings.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Server Name</Label>
            <Input
              id="name"
              placeholder="My Custom Server"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Server Type</Label>
            <Input
              id="type"
              placeholder="e.g., custom-api, database, etc."
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="config">Configuration (JSON)</Label>
            <Textarea
              id="config"
              placeholder='{"url": "http://localhost:3000", "apiKey": "..."}'
              value={configJson}
              onChange={(e) => handleJsonChange(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
            {jsonError && (
              <p className="text-sm text-destructive">{jsonError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Enter valid JSON configuration for this server
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim() || !type.trim() || !!jsonError}
            >
              {isSubmitting ? 'Saving...' : editConfig ? 'Update Server' : 'Add Server'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
