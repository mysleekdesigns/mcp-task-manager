'use client';

import { useState } from 'react';
import { PrCard } from './PrCard';
import { PrDetailModal } from './PrDetailModal';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { GitPullRequest } from 'lucide-react';
import { GitHubPullRequest, PrState } from './types';

interface PrListProps {
  prs: GitHubPullRequest[];
  loading?: boolean;
  error?: string | null;
}

const STATE_FILTERS: { value: PrState; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
  { value: 'merged', label: 'Merged' },
];

export function PrList({ prs, loading = false, error = null }: PrListProps) {
  const [selectedState, setSelectedState] = useState<PrState>('open');
  const [selectedPr, setSelectedPr] = useState<GitHubPullRequest | null>(null);

  const filteredPrs = prs.filter((pr) => {
    if (selectedState === 'all') return true;
    if (selectedState === 'merged') return pr.merged;
    if (selectedState === 'open') return pr.state === 'open' && !pr.merged;
    if (selectedState === 'closed') return pr.state === 'closed' && !pr.merged;
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Loading state */}
        <div className="flex gap-2">
          {STATE_FILTERS.map((filter) => (
            <Skeleton key={filter.value} className="h-6 w-16" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <GitPullRequest className="h-12 w-12 mx-auto mb-4 opacity-50 text-destructive" />
        <p className="text-destructive font-medium">Failed to load pull requests</p>
        <p className="text-sm text-muted-foreground mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {STATE_FILTERS.map((filter) => {
            const count = prs.filter((pr) => {
              if (filter.value === 'all') return true;
              if (filter.value === 'merged') return pr.merged;
              if (filter.value === 'open') return pr.state === 'open' && !pr.merged;
              if (filter.value === 'closed') return pr.state === 'closed' && !pr.merged;
              return true;
            }).length;

            return (
              <Badge
                key={filter.value}
                variant={selectedState === filter.value ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={() => setSelectedState(filter.value)}
              >
                {filter.label} ({count})
              </Badge>
            );
          })}
        </div>

        <div className="text-sm text-muted-foreground">
          {filteredPrs.length} {filteredPrs.length === 1 ? 'PR' : 'PRs'}
        </div>
      </div>

      {/* PR List */}
      {filteredPrs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <GitPullRequest className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No pull requests found</p>
          <p className="text-sm mt-2">
            {selectedState === 'all'
              ? 'This repository has no pull requests yet'
              : `No ${selectedState} pull requests`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPrs.map((pr) => (
            <PrCard key={pr.id} pr={pr} onClick={setSelectedPr} />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <PrDetailModal
        pr={selectedPr}
        open={!!selectedPr}
        onOpenChange={(open) => !open && setSelectedPr(null)}
      />
    </div>
  );
}
