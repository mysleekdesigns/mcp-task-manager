'use client';

import { useState } from 'react';
import { IdeaWithCreator } from '@/types/idea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronUp, ChevronDown, Lightbulb, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface IdeaCardProps {
  idea: IdeaWithCreator;
  onVote: (ideaId: string, action: 'upvote' | 'downvote') => Promise<void>;
  onConvert: (ideaId: string) => void;
  onDelete: (ideaId: string) => Promise<void>;
  canConvert?: boolean;
  canDelete?: boolean;
}

export function IdeaCard({ idea, onVote, onConvert, onDelete, canConvert, canDelete }: IdeaCardProps) {
  const [isVoting, setIsVoting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleVote = async (action: 'upvote' | 'downvote') => {
    setIsVoting(true);
    try {
      await onVote(idea.id, action);
    } finally {
      setIsVoting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(idea.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-gray-500';
      case 'UNDER_REVIEW':
        return 'bg-blue-500';
      case 'APPROVED':
        return 'bg-green-500';
      case 'REJECTED':
        return 'bg-red-500';
      case 'CONVERTED':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ');
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500 flex-shrink-0" />
              <span className="truncate">{idea.title}</span>
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={idea.createdBy.image || undefined} />
                <AvatarFallback>
                  {idea.createdBy.name?.charAt(0) || idea.createdBy.email.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">
                {idea.createdBy.name || idea.createdBy.email}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(idea.createdAt), { addSuffix: true })}
              </span>
            </CardDescription>
          </div>
          <Badge className={getStatusColor(idea.status)}>
            {getStatusLabel(idea.status)}
          </Badge>
        </div>
      </CardHeader>

      {idea.description && (
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {idea.description}
          </p>
        </CardContent>
      )}

      <CardFooter className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1 border rounded-md p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote('upvote')}
              disabled={isVoting || idea.status === 'CONVERTED'}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-cyan-400 active:text-cyan-400"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold">{idea.votes}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote('downvote')}
              disabled={isVoting || idea.votes <= 0 || idea.status === 'CONVERTED'}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-cyan-400 active:text-cyan-400"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canConvert && idea.status !== 'CONVERTED' && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onConvert(idea.id)}
            >
              Convert to Feature
            </Button>
          )}

          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isDeleting}
                  className="text-muted-foreground hover:text-cyan-400 active:text-cyan-400"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Idea</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this idea? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
