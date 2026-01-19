'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Memory } from '@/types/memory';

interface MemoryCardProps {
  memory: Memory;
}

export function MemoryCard({ memory }: MemoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getTypeConfig = (type: string) => {
    const typeLower = type.toLowerCase();
    switch (typeLower) {
      case 'pr_review':
        return {
          label: 'PR Review',
          className: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
        };
      case 'session':
        return {
          label: 'Session Insight',
          className: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        };
      case 'codebase':
        return {
          label: 'Codebase',
          className: 'bg-green-500/10 text-green-500 border-green-500/20',
        };
      case 'pattern':
        return {
          label: 'Pattern',
          className: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
        };
      case 'gotcha':
        return {
          label: 'Gotcha',
          className: 'bg-red-500/10 text-red-500 border-red-500/20',
        };
      default:
        return {
          label: type,
          className: 'bg-muted text-muted-foreground',
        };
    }
  };

  const typeConfig = getTypeConfig(memory.type);
  const relativeTime = formatDistanceToNow(new Date(memory.createdAt), { addSuffix: true });

  const previewLength = 150;
  const shouldShowToggle = memory.content.length > previewLength;
  const displayContent = isExpanded
    ? memory.content
    : memory.content.slice(0, previewLength) + (shouldShowToggle ? '...' : '');

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className={typeConfig.className}>
                {typeConfig.label}
              </Badge>
              <span className="text-xs text-muted-foreground">{relativeTime}</span>
            </div>
            <h3 className="font-semibold text-sm leading-tight">{memory.title}</h3>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {displayContent}
          </p>

          {shouldShowToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-cyan-400 active:text-cyan-400"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Show more
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
