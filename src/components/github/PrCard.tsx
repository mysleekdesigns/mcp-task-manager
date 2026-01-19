'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GitPullRequest, GitMerge, GitPullRequestClosed, Check, X, MessageSquare, Clock } from 'lucide-react';
import { formatDistanceToNow } from '@/lib/utils';
import { GitHubPullRequest, ReviewStatus } from './types';

interface PrCardProps {
  pr: GitHubPullRequest;
  onClick: (pr: GitHubPullRequest) => void;
}

export function PrCard({ pr, onClick }: PrCardProps) {
  const reviewStatus = getReviewStatus(pr.reviews || []);

  return (
    <Card
      className="p-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onClick(pr)}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 pt-1">
            {getPrIcon(pr)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <h4 className="font-medium text-sm line-clamp-2 flex-1">
                {pr.title}
                <span className="text-muted-foreground ml-2">#{pr.number}</span>
              </h4>
            </div>

            {/* Branch info */}
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <code className="px-1.5 py-0.5 bg-muted rounded font-mono">
                {pr.head.ref}
              </code>
              <span>→</span>
              <code className="px-1.5 py-0.5 bg-muted rounded font-mono">
                {pr.base.ref}
              </code>
            </div>
          </div>

          <div className="flex-shrink-0">
            {getStateBadge(pr)}
          </div>
        </div>

        {/* Labels */}
        {pr.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {pr.labels.slice(0, 3).map((label) => (
              <Badge
                key={label.id}
                variant="outline"
                className="text-xs px-2 py-0"
                style={{
                  borderColor: `#${label.color}`,
                  color: `#${label.color}`,
                }}
              >
                {label.name}
              </Badge>
            ))}
            {pr.labels.length > 3 && (
              <Badge variant="outline" className="text-xs px-2 py-0">
                +{pr.labels.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Review Status */}
        {(reviewStatus.approved > 0 || reviewStatus.changesRequested > 0) && (
          <div className="flex items-center gap-3 text-xs">
            {reviewStatus.approved > 0 && (
              <div className="flex items-center gap-1 text-green-600">
                <Check className="h-3 w-3" />
                <span>{reviewStatus.approved} approved</span>
              </div>
            )}
            {reviewStatus.changesRequested > 0 && (
              <div className="flex items-center gap-1 text-red-600">
                <X className="h-3 w-3" />
                <span>{reviewStatus.changesRequested} changes requested</span>
              </div>
            )}
            {reviewStatus.commented > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <MessageSquare className="h-3 w-3" />
                <span>{reviewStatus.commented} commented</span>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={pr.user.avatar_url} alt={pr.user.login} />
              <AvatarFallback>{pr.user.login[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">
              {pr.user.login}
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(pr.created_at))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function getPrIcon(pr: GitHubPullRequest) {
  if (pr.merged) {
    return <GitMerge className="h-5 w-5 text-purple-600" />;
  }
  if (pr.state === 'closed') {
    return <GitPullRequestClosed className="h-5 w-5 text-red-600" />;
  }
  return <GitPullRequest className="h-5 w-5 text-green-600" />;
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

function getReviewStatus(reviews: GitHubPullRequest['reviews']): ReviewStatus {
  if (!reviews) {
    return { approved: 0, changesRequested: 0, commented: 0, pending: 0 };
  }

  // Get the latest review from each reviewer
  const latestReviews = new Map<string, string>();
  reviews.forEach((review) => {
    const existing = latestReviews.get(review.user.login);
    if (!existing || (review.submitted_at && (!existing || review.submitted_at > existing))) {
      latestReviews.set(review.user.login, review.state);
    }
  });

  const status = { approved: 0, changesRequested: 0, commented: 0, pending: 0 };
  latestReviews.forEach((state) => {
    if (state === 'APPROVED') status.approved++;
    else if (state === 'CHANGES_REQUESTED') status.changesRequested++;
    else if (state === 'COMMENTED') status.commented++;
    else if (state === 'PENDING') status.pending++;
  });

  return status;
}
