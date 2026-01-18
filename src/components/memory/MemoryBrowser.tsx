'use client';

import { useEffect, useState } from 'react';
import { MemoryCard } from './MemoryCard';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import type { Memory } from '@/types/memory';

interface MemoryBrowserProps {
  projectId: string;
  typeFilter?: string;
  searchQuery?: string;
}

export function MemoryBrowser({ projectId, typeFilter = 'all', searchQuery = '' }: MemoryBrowserProps) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMemories = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        projectId,
        ...(typeFilter !== 'all' && { type: typeFilter }),
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/memories?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch memories');
      }

      const data = await response.json();
      setMemories(data || []);
    } catch (error) {
      console.error('Failed to fetch memories:', error);
      toast.error('Failed to load memories');
      setMemories([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, typeFilter, searchQuery]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (memories.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground">
          {searchQuery || typeFilter !== 'all'
            ? 'No memories found matching your filters'
            : 'No memories yet. Memories will be created as you work with Claude Code.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {memories.map((memory) => (
        <MemoryCard key={memory.id} memory={memory} />
      ))}
    </div>
  );
}
