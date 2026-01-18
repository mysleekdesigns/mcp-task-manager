'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface InvokeClaudeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  terminalCount: number;
  onInvoke: (command: string) => Promise<void>;
}

export function InvokeClaudeModal({
  open,
  onOpenChange,
  terminalCount,
  onInvoke,
}: InvokeClaudeModalProps) {
  const [command, setCommand] = useState('');
  const [isInvoking, setIsInvoking] = useState(false);

  const handleInvoke = async () => {
    if (!command.trim()) return;

    setIsInvoking(true);
    try {
      await onInvoke(command);
      setCommand('');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to invoke Claude:', error);
    } finally {
      setIsInvoking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Cmd/Ctrl + Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleInvoke();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Invoke Claude All</DialogTitle>
          <DialogDescription>
            Send a command to all {terminalCount} active terminals simultaneously.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {terminalCount} {terminalCount === 1 ? 'terminal' : 'terminals'}
            </Badge>
          </div>

          <div>
            <Textarea
              placeholder="Enter command to broadcast to all terminals..."
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[120px] font-mono text-sm"
              disabled={isInvoking}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Press{' '}
              <kbd className="rounded border bg-muted px-1.5 py-0.5">
                {navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'}
              </kbd>{' '}
              +{' '}
              <kbd className="rounded border bg-muted px-1.5 py-0.5">
                Enter
              </kbd>{' '}
              to invoke
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isInvoking}
          >
            Cancel
          </Button>
          <Button onClick={handleInvoke} disabled={!command.trim() || isInvoking}>
            {isInvoking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isInvoking ? 'Invoking...' : 'Invoke All'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
