'use client';

import { useState, useEffect, useCallback } from 'react';
import { IdeaWithCreator, IdeaSortOption, IdeaSortDirection } from '@/types/idea';
import { IdeaCard } from './idea-card';
import { NewIdeaForm } from './new-idea-form';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ArrowUpDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface IdeationBoardProps {
  projectId: string;
  userRole: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  userId: string;
}

export function IdeationBoard({ projectId, userRole, userId }: IdeationBoardProps) {
  const [ideas, setIdeas] = useState<IdeaWithCreator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<IdeaSortOption>('votes');
  const [sortDirection, setSortDirection] = useState<IdeaSortDirection>('desc');
  const [activeTab, setActiveTab] = useState('all');
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const { toast } = useToast();

  const canConvert = userRole === 'OWNER' || userRole === 'ADMIN';

  const fetchIdeas = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        projectId,
        sortBy,
        sortDirection,
      });

      if (activeTab !== 'all') {
        params.append('status', activeTab.toUpperCase());
      }

      const response = await fetch(`/api/ideas?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch ideas');
      }

      const data = await response.json();
      setIdeas(data);
    } catch (error) {
      console.error('Error fetching ideas:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch ideas',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- toast is stable but causes infinite loop if included
  }, [projectId, sortBy, sortDirection, activeTab]);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  const handleVote = async (ideaId: string, action: 'upvote' | 'downvote') => {
    try {
      const response = await fetch(`/api/ideas/${ideaId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error('Failed to vote on idea');
      }

      const updatedIdea = await response.json();

      setIdeas((prev) =>
        prev.map((idea) => (idea.id === ideaId ? updatedIdea : idea))
      );

      toast({
        title: 'Success',
        description: `Vote ${action === 'upvote' ? 'added' : 'removed'}`,
      });
    } catch (error) {
      console.error('Error voting on idea:', error);
      toast({
        title: 'Error',
        description: 'Failed to vote on idea',
        variant: 'destructive',
      });
    }
  };

  const handleConvertClick = (ideaId: string) => {
    setSelectedIdeaId(ideaId);
    setConvertDialogOpen(true);
  };

  const handleConvert = async () => {
    if (!selectedIdeaId) return;

    setIsConverting(true);
    try {
      const response = await fetch(`/api/ideas/${selectedIdeaId}/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to convert idea');
      }

      const { idea } = await response.json();

      setIdeas((prev) =>
        prev.map((i) => (i.id === selectedIdeaId ? idea : i))
      );

      toast({
        title: 'Success',
        description: 'Idea converted to feature successfully',
      });

      setConvertDialogOpen(false);
      setSelectedIdeaId(null);
    } catch (error) {
      console.error('Error converting idea:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to convert idea',
        variant: 'destructive',
      });
    } finally {
      setIsConverting(false);
    }
  };

  const handleDelete = async (ideaId: string) => {
    try {
      const response = await fetch(`/api/ideas/${ideaId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete idea');
      }

      setIdeas((prev) => prev.filter((idea) => idea.id !== ideaId));

      toast({
        title: 'Success',
        description: 'Idea deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting idea:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete idea',
        variant: 'destructive',
      });
    }
  };

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const filteredIdeas = ideas.filter((idea) => {
    if (activeTab === 'all') return true;
    return idea.status === activeTab.toUpperCase();
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ideation Board</h1>
          <p className="text-muted-foreground mt-1">
            Capture, vote on, and convert ideas into features
          </p>
        </div>
        <NewIdeaForm projectId={projectId} onIdeaCreated={fetchIdeas} />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="sort-by" className="text-sm font-medium">
            Sort by:
          </Label>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as IdeaSortOption)}>
            <SelectTrigger id="sort-by" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="votes">Votes</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="title">Title</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleSortDirection}
            title={`Sort ${sortDirection === 'asc' ? 'ascending' : 'descending'}`}
            className="text-muted-foreground hover:text-cyan-400 active:text-cyan-400"
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Ideas</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="under_review">Under Review</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="converted">Converted</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading ideas...</p>
            </div>
          ) : filteredIdeas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground mb-4">No ideas yet</p>
              <NewIdeaForm projectId={projectId} onIdeaCreated={fetchIdeas} />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredIdeas.map((idea) => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  onVote={handleVote}
                  onConvert={handleConvertClick}
                  onDelete={handleDelete}
                  canConvert={canConvert}
                  canDelete={canConvert || idea.createdById === userId}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert to Feature</DialogTitle>
            <DialogDescription>
              This will create a new feature from this idea and mark the idea as converted.
              The feature priority will be automatically assigned based on the number of votes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConvertDialogOpen(false)}
              disabled={isConverting}
              className="text-muted-foreground hover:text-cyan-400 active:text-cyan-400"
            >
              Cancel
            </Button>
            <Button onClick={handleConvert} disabled={isConverting}>
              {isConverting ? 'Converting...' : 'Convert'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
