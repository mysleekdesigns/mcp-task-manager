'use client';

import { GitHubIssue } from '@/types/github';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, GitBranch } from 'lucide-react';

interface IssueCardProps {
  issue: GitHubIssue;
  onViewDetails: (issue: GitHubIssue) => void;
  onCreateTask: (issue: GitHubIssue) => void;
}

export function IssueCard({ issue, onViewDetails, onCreateTask }: IssueCardProps) {
  const isOpen = issue.state === 'open';

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onViewDetails(issue)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={isOpen ? 'default' : 'secondary'} className={isOpen ? 'bg-green-500' : 'bg-purple-500'}>
                {isOpen ? 'Open' : 'Closed'}
              </Badge>
              <span className="text-sm text-muted-foreground">#{issue.number}</span>
            </div>
            <h3 className="font-semibold text-base leading-tight line-clamp-2">{issue.title}</h3>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onCreateTask(issue);
            }}
            className="flex-shrink-0 text-muted-foreground hover:text-cyan-400 active:text-cyan-400"
          >
            <GitBranch className="h-4 w-4 mr-1" />
            Create Task
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Labels */}
        {issue.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {issue.labels.slice(0, 5).map((label) => (
              <Badge
                key={label.id}
                variant="outline"
                style={{
                  backgroundColor: `#${label.color}20`,
                  borderColor: `#${label.color}`,
                  color: `#${label.color}`,
                }}
                className="text-xs"
              >
                {label.name}
              </Badge>
            ))}
            {issue.labels.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{issue.labels.length - 5} more
              </Badge>
            )}
          </div>
        )}

        {/* Footer Info */}
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-3">
            {/* Assignees */}
            {issue.assignees.length > 0 && (
              <div className="flex items-center -space-x-2">
                {issue.assignees.slice(0, 3).map((assignee) => (
                  <Avatar key={assignee.id} className="h-6 w-6 border-2 border-background">
                    <AvatarImage src={assignee.avatar_url} alt={assignee.login} />
                    <AvatarFallback className="text-xs">{assignee.login.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                ))}
                {issue.assignees.length > 3 && (
                  <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                    <span className="text-xs">+{issue.assignees.length - 3}</span>
                  </div>
                )}
              </div>
            )}

            {/* Comments */}
            {issue.comments > 0 && (
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span>{issue.comments}</span>
              </div>
            )}
          </div>

          {/* Created Date */}
          <span className="text-xs">
            opened {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
