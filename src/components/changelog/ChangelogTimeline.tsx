'use client';

import { ChangelogGroupedByDate, ChangelogGroupedByVersion } from '@/types/changelog';
import { ChangelogEntry } from './ChangelogEntry';
import { format } from 'date-fns';

type ChangelogGroup = ChangelogGroupedByDate | ChangelogGroupedByVersion;

interface ChangelogTimelineProps {
  groups: ChangelogGroup[];
  showProject?: boolean;
}

function isDateGroup(group: ChangelogGroup): group is ChangelogGroupedByDate {
  return 'date' in group;
}

function getGroupLabel(group: ChangelogGroup): string {
  if (isDateGroup(group)) {
    return format(new Date(group.date), 'MMMM d, yyyy');
  }
  return group.version || 'Unreleased';
}

function getGroupKey(group: ChangelogGroup): string {
  if (isDateGroup(group)) {
    return group.date;
  }
  return group.version;
}

export function ChangelogTimeline({ groups, showProject = false }: ChangelogTimelineProps) {
  if (groups.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No changelog entries yet.</p>
        <p className="text-sm mt-2">Create entries manually or generate from completed tasks.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <div key={getGroupKey(group)} className="space-y-4">
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2">
            <h2 className="text-xl font-semibold">
              {getGroupLabel(group)}
            </h2>
            <div className="h-px bg-border mt-2" />
          </div>
          <div className="space-y-4">
            {group.entries.map((entry) => (
              <ChangelogEntry
                key={entry.id}
                entry={entry}
                showProject={showProject}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
