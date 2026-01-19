'use client';

import Link from 'next/link';
import { ChangelogType } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChangelogEntryWithTask } from '@/types/changelog';
import { formatDistanceToNow } from 'date-fns';
import {
  Sparkles,
  Bug,
  Wrench,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';

interface ChangelogEntryProps {
  entry: ChangelogEntryWithTask;
  showProject?: boolean;
}

const typeConfig = {
  FEATURE: {
    label: 'Feature',
    icon: Sparkles,
    variant: 'default' as const,
    className: 'bg-blue-500 text-white border-blue-600',
  },
  FIX: {
    label: 'Fix',
    icon: Bug,
    variant: 'secondary' as const,
    className: 'bg-green-500 text-white border-green-600',
  },
  IMPROVEMENT: {
    label: 'Improvement',
    icon: Wrench,
    variant: 'outline' as const,
    className: 'bg-purple-500 text-white border-purple-600',
  },
  BREAKING: {
    label: 'Breaking',
    icon: AlertTriangle,
    variant: 'destructive' as const,
    className: 'bg-red-500 text-white border-red-600',
  },
};

export function ChangelogEntry({ entry, showProject = false }: ChangelogEntryProps) {
  const config = typeConfig[entry.type as ChangelogType];
  const Icon = config.icon;

  return (
    <Card className="relative overflow-hidden">
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${
          entry.type === 'FEATURE' ? 'bg-blue-500' :
          entry.type === 'FIX' ? 'bg-green-500' :
          entry.type === 'IMPROVEMENT' ? 'bg-purple-500' :
          'bg-red-500'
        }`}
      />
      <CardHeader className="pl-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-lg">{entry.title}</CardTitle>
              {entry.version && (
                <Badge variant="outline" className="text-xs">
                  v{entry.version}
                </Badge>
              )}
            </div>
            <CardDescription className="flex items-center gap-2 text-xs">
              <span>{formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}</span>
              {showProject && entry.project && (
                <>
                  <span>•</span>
                  <span>{entry.project.name}</span>
                </>
              )}
            </CardDescription>
          </div>
          <Badge className={config.className}>
            <Icon className="h-3 w-3" />
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      {(entry.description || entry.task) && (
        <CardContent className="pl-6 space-y-3">
          {entry.description && (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {entry.description}
            </p>
          )}
          {entry.task && (
            <Link
              href={`/dashboard/kanban?task=${entry.task.id}`}
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <span>Related task: {entry.task.title}</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </CardContent>
      )}
    </Card>
  );
}
