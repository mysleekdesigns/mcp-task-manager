'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Wand2 } from 'lucide-react';

interface GenerateChangelogDialogProps {
  projectId: string;
}

export function GenerateChangelogDialog({ projectId }: GenerateChangelogDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [version, setVersion] = useState('');

  const handleGenerate = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/changelog/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          version: version || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate changelog entries');
      }

      const data = await response.json();

      if (data.count === 0) {
        toast.info(data.message || 'No new completed tasks to add to changelog');
      } else {
        toast.success(`Generated ${data.count} changelog ${data.count === 1 ? 'entry' : 'entries'}`);
      }

      setOpen(false);
      setVersion('');
      router.refresh();
    } catch (error) {
      console.error('Error generating changelog entries:', error);
      toast.error('Failed to generate changelog entries');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Wand2 className="h-4 w-4 mr-2" />
          Generate from Tasks
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generate Changelog</DialogTitle>
          <DialogDescription>
            Auto-generate changelog entries from completed tasks that don&apos;t have entries yet.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="version">Version (optional)</Label>
            <Input
              id="version"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="1.0.0"
            />
            <p className="text-xs text-muted-foreground">
              Tag all generated entries with this version number.
            </p>
          </div>
          <div className="rounded-lg border p-4 bg-muted/50">
            <h4 className="text-sm font-medium mb-2">What happens:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Finds all completed tasks without changelog entries</li>
              <li>Creates entries based on task titles and tags</li>
              <li>Automatically categorizes by type (feature, fix, etc.)</li>
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? 'Generating...' : 'Generate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
