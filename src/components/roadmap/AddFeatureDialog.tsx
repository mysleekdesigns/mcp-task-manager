'use client';

import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { MoscowPriority, Phase } from '@/types/roadmap';

interface AddFeatureDialogProps {
  phases: Phase[];
  projectId: string;
  onAdd?: (data: {
    title: string;
    description: string;
    priority: MoscowPriority;
    phaseId?: string;
  }) => void;
  trigger?: React.ReactNode;
}

export function AddFeatureDialog({ phases, onAdd, trigger }: AddFeatureDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<MoscowPriority>('SHOULD');
  const [phaseId, setPhaseId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);

    try {
      await onAdd?.({
        title: title.trim(),
        description: description.trim(),
        priority,
        phaseId: phaseId || undefined,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setPriority('SHOULD');
      setPhaseId('');
      setOpen(false);
    } catch (error) {
      console.error('Failed to add feature:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="text-muted-foreground hover:text-cyan-400 active:text-cyan-400">
            + Add Feature
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Feature</DialogTitle>
          <DialogDescription>
            Create a new feature for your roadmap. Assign a MoSCoW priority to help with planning.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Feature title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe this feature..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={(value) => setPriority(value as MoscowPriority)}>
              <SelectTrigger id="priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MUST">Must Have</SelectItem>
                <SelectItem value="SHOULD">Should Have</SelectItem>
                <SelectItem value="COULD">Could Have</SelectItem>
                <SelectItem value="WONT">Won&apos;t Have</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phase">Phase (Optional)</Label>
            <Select value={phaseId} onValueChange={setPhaseId}>
              <SelectTrigger id="phase">
                <SelectValue placeholder="Select a phase..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No Phase</SelectItem>
                {phases.map((phase) => (
                  <SelectItem key={phase.id} value={phase.id}>
                    Phase {phase.order}: {phase.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
              className="text-muted-foreground hover:text-cyan-400 active:text-cyan-400"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !title.trim()}>
              {isSubmitting ? 'Creating...' : 'Create Feature'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
