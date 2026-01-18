'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GitBranch } from 'lucide-react';

interface Worktree {
  id: string;
  name: string;
  branch: string;
}

interface WorktreeSelectorProps {
  worktrees: Worktree[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function WorktreeSelector({
  worktrees,
  value,
  onValueChange,
  placeholder = 'Select worktree',
  disabled = false,
  className,
}: WorktreeSelectorProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4" />
          <SelectValue placeholder={placeholder} />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            <div>
              <div className="font-medium">Main</div>
              <div className="text-xs text-muted-foreground">Default worktree</div>
            </div>
          </div>
        </SelectItem>
        {worktrees.map((worktree) => (
          <SelectItem key={worktree.id} value={worktree.id}>
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              <div>
                <div className="font-medium">{worktree.name}</div>
                <div className="text-xs text-muted-foreground">{worktree.branch}</div>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
