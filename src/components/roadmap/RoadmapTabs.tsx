'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Phase } from '@/types/roadmap';

interface RoadmapTabsProps {
  children: React.ReactNode;
  phases: Phase[];
}

export function RoadmapTabs({ children }: RoadmapTabsProps) {
  return (
    <Tabs defaultValue="phases" className="w-full">
      <TabsList>
        <TabsTrigger value="phases">Phases View</TabsTrigger>
        <TabsTrigger value="kanban">Kanban View</TabsTrigger>
        <TabsTrigger value="features">All Features</TabsTrigger>
        <TabsTrigger value="priority">By Priority</TabsTrigger>
      </TabsList>

      <TabsContent value="phases" className="mt-6">
        {children}
      </TabsContent>

      <TabsContent value="kanban" className="mt-6">
        <div className="text-center py-12 text-muted-foreground">
          Kanban view coming soon
        </div>
      </TabsContent>

      <TabsContent value="features" className="mt-6">
        <div className="text-center py-12 text-muted-foreground">
          All features view coming soon
        </div>
      </TabsContent>

      <TabsContent value="priority" className="mt-6">
        <div className="text-center py-12 text-muted-foreground">
          Priority view coming soon
        </div>
      </TabsContent>
    </Tabs>
  );
}
