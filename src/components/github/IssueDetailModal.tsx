'use client';

import { useState, useEffect } from 'react';
import { GitHubIssue, GitHubComment } from '@/types/github';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink, GitBranch, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface IssueDetailModalProps {
  issue: GitHubIssue | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTask: (issue: GitHubIssue) => void;
}

export function IssueDetailModal({ issue, open, onOpenChange, onCreateTask }: IssueDetailModalProps) {
  const [comments, setComments] = useState<GitHubComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    if (!issue || !open) {
      setComments([]);
      return;
    }

    if (issue.comments === 0) {
      return;
    }

    const fetchComments = async () => {
      try {
        setLoadingComments(true);
        const response = await fetch(`/api/github/issues/${issue.number}/comments`);

        if (!response.ok) {
          throw new Error('Failed to fetch comments');
        }

        const data = await response.json();
        setComments(data.comments || []);
      } catch (err) {
        console.error('Error fetching comments:', err);
        toast.error('Failed to load comments');
      } finally {
        setLoadingComments(false);
      }
    };

    fetchComments();
  }, [issue, open]);

  if (!issue) return null;

  const isOpen = issue.state === 'open';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={isOpen ? 'default' : 'secondary'} className={isOpen ? 'bg-green-500' : 'bg-purple-500'}>
                  {isOpen ? 'Open' : 'Closed'}
                </Badge>
                <span className="text-sm text-muted-foreground">#{issue.number}</span>
              </div>
              <DialogTitle className="text-xl">{issue.title}</DialogTitle>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(issue.html_url, '_blank')}
                className="text-muted-foreground hover:text-cyan-400 active:text-cyan-400"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                GitHub
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  onCreateTask(issue);
                  onOpenChange(false);
                }}
              >
                <GitBranch className="h-4 w-4 mr-1" />
                Create Task
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Author and Dates */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={issue.user.avatar_url} alt={issue.user.login} />
                <AvatarFallback>{issue.user.login.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span>
                <strong className="text-foreground">{issue.user.login}</strong> opened this issue
              </span>
            </div>
            <span>{formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}</span>
          </div>

          {/* Labels */}
          {issue.labels.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Labels</h4>
              <div className="flex flex-wrap gap-2">
                {issue.labels.map((label) => (
                  <Badge
                    key={label.id}
                    variant="outline"
                    style={{
                      backgroundColor: `#${label.color}20`,
                      borderColor: `#${label.color}`,
                      color: `#${label.color}`,
                    }}
                  >
                    {label.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Assignees */}
          {issue.assignees.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Assignees</h4>
              <div className="flex flex-wrap gap-3">
                {issue.assignees.map((assignee) => (
                  <div key={assignee.id} className="flex items-center gap-2 text-sm">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={assignee.avatar_url} alt={assignee.login} />
                      <AvatarFallback>{assignee.login.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span>{assignee.login}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Description */}
          <div>
            <h4 className="text-sm font-medium mb-3">Description</h4>
            {issue.body ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{issue.body}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No description provided</p>
            )}
          </div>

          {/* Comments */}
          {issue.comments > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Comments ({issue.comments})
                </h4>

                {loadingComments ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-6 w-6 rounded-full" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-16 w-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={comment.user.avatar_url} alt={comment.user.login} />
                            <AvatarFallback>{comment.user.login.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{comment.user.login}</span>
                          <span className="text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <ReactMarkdown>{comment.body}</ReactMarkdown>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
