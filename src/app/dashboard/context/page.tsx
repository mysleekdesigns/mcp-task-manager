'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MemoryBrowser } from '@/components/memory/MemoryBrowser';
import { Search, Database, Brain } from 'lucide-react';

const MEMORY_TYPES = [
  { value: 'all', label: 'All' },
  { value: 'pr_review', label: 'PR Reviews' },
  { value: 'session', label: 'Sessions' },
  { value: 'codebase', label: 'Codebase' },
  { value: 'pattern', label: 'Patterns' },
  { value: 'gotcha', label: 'Gotchas' },
] as const;

export default function ContextPage() {
  const [projectId] = useState('default-project'); // TODO: Get from context/params
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [memoryCount] = useState(0); // TODO: Get from API

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Context & Memory</h1>
        <p className="text-muted-foreground mt-2">
          Project knowledge base and AI context management
        </p>
      </div>

      <Tabs defaultValue="memories" className="space-y-6">
        <TabsList>
          <TabsTrigger value="index" className="gap-2">
            <Database className="h-4 w-4" />
            Project Index
          </TabsTrigger>
          <TabsTrigger value="memories" className="gap-2">
            <Brain className="h-4 w-4" />
            Memories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="index" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Codebase Overview</CardTitle>
              <CardDescription>
                Indexed files, dependencies, and project structure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Project indexing coming soon</p>
                <p className="text-sm mt-2">
                  This will display file structure, dependencies, and code maps
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="memories" className="space-y-6">
          {/* Graphiti Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Graph Memory Status
              </CardTitle>
              <CardDescription>
                Graphiti integration for graph-based memory storage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Graphiti integration coming soon</p>
                <p className="text-xs mt-2">
                  Enhanced memory with knowledge graphs and entity relationships
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search memories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {MEMORY_TYPES.map((type) => (
                  <Badge
                    key={type.value}
                    variant={selectedType === type.value ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-primary/10 transition-colors"
                    onClick={() => setSelectedType(type.value)}
                  >
                    {type.label}
                  </Badge>
                ))}
              </div>

              <div className="text-sm text-muted-foreground">
                {memoryCount} {memoryCount === 1 ? 'memory' : 'memories'}
              </div>
            </div>
          </div>

          {/* Memory List */}
          <MemoryBrowser
            projectId={projectId}
            typeFilter={selectedType}
            searchQuery={searchQuery}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
