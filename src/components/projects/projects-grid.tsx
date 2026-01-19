"use client"

import * as React from "react"
import { ProjectCard } from "./project-card"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircleIcon } from "lucide-react"

interface ProjectMember {
  id: string
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER"
  user: {
    id: string
    name: string
    email: string
    image: string | null
  }
}

interface Project {
  id: string
  name: string
  description: string | null
  targetPath: string | null
  githubRepo: string | null
  createdAt: string
  members: ProjectMember[]
  _count: {
    tasks: number
    terminals: number
    worktrees: number
  }
}

interface ProjectsGridProps {
  projects: Project[]
  selectedProjectId: string | null
  onSelectProject: (projectId: string) => void
  currentUserId?: string
  isLoading?: boolean
  error?: string | null
}

export function ProjectsGrid({
  projects,
  selectedProjectId,
  onSelectProject,
  currentUserId,
  isLoading = false,
  error = null,
}: ProjectsGridProps) {
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircleIcon className="h-4 w-4" />
        <AlertTitle>Error loading projects</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
              </div>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          isSelected={project.id === selectedProjectId}
          onSelect={onSelectProject}
          currentUserId={currentUserId}
        />
      ))}
    </div>
  )
}
