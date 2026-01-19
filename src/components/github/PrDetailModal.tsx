'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  GitPullRequest,
  GitMerge,
  GitPullRequestClosed,
  ExternalLink,
  Calendar,
  GitBranch,
  FileText,
  Check,
  X,
  MessageSquare,
  Clock,
  User,
  Tag,
} from 'lucide-react';
import { formatDistanceToNow } from '@/lib/utils';
import { GitHubPullRequest } from './types';
import ReactMarkdown from 'react-markdown';

interface PrDetailModalProps {
  pr: GitHubPullRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrDetailModal({ pr, open, onOpenChange }: PrDetailModalProps) {
  if (!pr) return null;

  const reviews = pr.reviews || [];
  const latestReviews = getLatestReviews(reviews);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="space-y-3">
          {/* Title and Number */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 pt-1">
              {getPrIcon(pr)}
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl">
                {pr.title}
                <span className="text-muted-foreground ml-2 font-normal">
                  #{pr.number}
                </span>
              </DialogTitle>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {getStateBadge(pr)}
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(pr.html_url, '_blank')}
                className="text-muted-foreground hover:text-cyan-400 active:text-cyan-400"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                View on GitHub
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Author and Dates */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={pr.user.avatar_url} alt={pr.user.login} />
                <AvatarFallback>{pr.user.login[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{pr.user.login}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                Created {formatDistanceToNow(new Date(pr.created_at))}
              </span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                Updated {formatDistanceToNow(new Date(pr.updated_at))}
              </span>
            </div>
          </div>

          <Separator />

          {/* Branch Information */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Branches
            </h3>
            <div className="flex items-center gap-2 text-sm">
              <code className="px-2 py-1 bg-muted rounded font-mono">
                {pr.head.ref}
              </code>
              <span className="text-muted-foreground">→</span>
              <code className="px-2 py-1 bg-muted rounded font-mono">
                {pr.base.ref}
              </code>
            </div>
          </div>

          <Separator />

          {/* Description */}
          {pr.body && (
            <>
              <div className="space-y-2">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Description
                </h3>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{pr.body}</ReactMarkdown>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Labels */}
          {pr.labels.length > 0 && (
            <>
              <div className="space-y-2">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Labels
                </h3>
                <div className="flex flex-wrap gap-2">
                  {pr.labels.map((label) => (
                    <Badge
                      key={label.id}
                      variant="outline"
                      style={{
                        borderColor: `#${label.color}`,
                        color: `#${label.color}`,
                      }}
                    >
                      {label.name}
                    </Badge>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Assignees and Reviewers */}
          {(pr.assignees.length > 0 || pr.requested_reviewers.length > 0) && (
            <>
              <div className="grid grid-cols-2 gap-4">
                {pr.assignees.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Assignees
                    </h3>
                    <div className="space-y-2">
                      {pr.assignees.map((assignee) => (
                        <div key={assignee.login} className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={assignee.avatar_url} alt={assignee.login} />
                            <AvatarFallback>
                              {assignee.login[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{assignee.login}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {pr.requested_reviewers.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Requested Reviewers
                    </h3>
                    <div className="space-y-2">
                      {pr.requested_reviewers.map((reviewer) => (
                        <div key={reviewer.login} className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={reviewer.avatar_url} alt={reviewer.login} />
                            <AvatarFallback>
                              {reviewer.login[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{reviewer.login}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Separator />
            </>
          )}

          {/* Changed Files Summary */}
          {(pr.additions !== undefined || pr.deletions !== undefined) && (
            <>
              <div className="space-y-2">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Changes
                </h3>
                <div className="flex items-center gap-4 text-sm">
                  {pr.changed_files !== undefined && (
                    <span className="text-muted-foreground">
                      {pr.changed_files} {pr.changed_files === 1 ? 'file' : 'files'} changed
                    </span>
                  )}
                  {pr.additions !== undefined && (
                    <span className="text-green-600">+{pr.additions}</span>
                  )}
                  {pr.deletions !== undefined && (
                    <span className="text-red-600">-{pr.deletions}</span>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Reviews */}
          {latestReviews.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Reviews
              </h3>
              <div className="space-y-2">
                {latestReviews.map((review) => (
                  <div
                    key={review.id}
                    className="flex items-start gap-2 p-3 rounded-lg border"
                  >
                    <Avatar className="h-6 w-6 mt-0.5">
                      <AvatarImage src={review.user.avatar_url} alt={review.user.login} />
                      <AvatarFallback>
                        {review.user.login[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{review.user.login}</span>
                        {getReviewBadge(review.state)}
                        {review.submitted_at && (
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(review.submitted_at))}
                          </span>
                        )}
                      </div>
                      {review.body && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {review.body}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-cyan-400 active:text-cyan-400">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getPrIcon(pr: GitHubPullRequest) {
  if (pr.merged) {
    return <GitMerge className="h-6 w-6 text-purple-600" />;
  }
  if (pr.state === 'closed') {
    return <GitPullRequestClosed className="h-6 w-6 text-red-600" />;
  }
  return <GitPullRequest className="h-6 w-6 text-green-600" />;
}

function getStateBadge(pr: GitHubPullRequest) {
  if (pr.merged) {
    return <Badge className="bg-purple-600">Merged</Badge>;
  }
  if (pr.state === 'closed') {
    return <Badge variant="destructive">Closed</Badge>;
  }
  if (pr.draft) {
    return <Badge variant="secondary">Draft</Badge>;
  }
  return <Badge className="bg-green-600">Open</Badge>;
}

function getReviewBadge(state: string) {
  switch (state) {
    case 'APPROVED':
      return (
        <Badge variant="outline" className="text-green-600 border-green-600">
          <Check className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      );
    case 'CHANGES_REQUESTED':
      return (
        <Badge variant="outline" className="text-red-600 border-red-600">
          <X className="h-3 w-3 mr-1" />
          Changes requested
        </Badge>
      );
    case 'COMMENTED':
      return (
        <Badge variant="outline">
          <MessageSquare className="h-3 w-3 mr-1" />
          Commented
        </Badge>
      );
    default:
      return <Badge variant="outline">Pending</Badge>;
  }
}

function getLatestReviews(reviews: GitHubPullRequest['reviews']) {
  if (!reviews) return [];

  // Get the latest review from each reviewer
  const reviewMap = new Map<string, typeof reviews[0]>();
  reviews.forEach((review) => {
    const existing = reviewMap.get(review.user.login);
    if (
      !existing ||
      (review.submitted_at &&
        existing.submitted_at &&
        review.submitted_at > existing.submitted_at)
    ) {
      reviewMap.set(review.user.login, review);
    }
  });

  return Array.from(reviewMap.values());
}
