"use client"

import * as React from "react"
import { ProjectsGrid } from "@/components/projects/projects-grid"
import { EmptyProjectsState } from "@/components/projects/empty-projects-state"
import { CreateProjectModal } from "@/components/projects/create-project-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircleIcon } from "lucide-react"
import { toast } from "sonner"

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

interface WelcomePageProps {
  currentUserId?: string
}

const STORAGE_KEY = "currentProjectId"

export function WelcomePage({ currentUserId }: WelcomePageProps) {
  const [projects, setProjects] = React.useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)

  // Load selected project from localStorage on mount
  React.useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setSelectedProjectId(stored)
    }
  }, [])

  // Fetch projects
  const fetchProjects = React.useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/projects")

      if (!response.ok) {
        throw new Error("Failed to fetch projects")
      }

      const data = await response.json()
      setProjects(data)

      // If no project is selected but we have projects, select the first one
      if (!selectedProjectId && data.length > 0) {
        const firstProjectId = data[0].id
        setSelectedProjectId(firstProjectId)
        localStorage.setItem(STORAGE_KEY, firstProjectId)
        window.dispatchEvent(new CustomEvent("projects-changed", { detail: { projectId: firstProjectId } }))
      }
    } catch (err) {
      console.error("Error fetching projects:", err)
      setError(err instanceof Error ? err.message : "Failed to load projects")
      toast.error("Failed to load projects")
    } finally {
      setIsLoading(false)
    }
  }, [selectedProjectId])

  React.useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  // Handle project selection
  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId)
    localStorage.setItem(STORAGE_KEY, projectId)

    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent("projects-changed", { detail: { projectId } }))

    toast.success("Project selected")
  }

  // Handle project creation success
  const handleProjectCreated = (projectId: string) => {
    fetchProjects()
    setSelectedProjectId(projectId)
    localStorage.setItem(STORAGE_KEY, projectId)
    window.dispatchEvent(new CustomEvent("projects-changed", { detail: { projectId } }))
  }

  // Handle create button click
  const handleCreateClick = () => {
    setIsCreateModalOpen(true)
  }

  // Show empty state if no projects
  if (!isLoading && projects.length === 0) {
    return (
      <>
        <EmptyProjectsState onCreateProject={handleCreateClick} />
        <CreateProjectModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          onSuccess={handleProjectCreated}
        />
      </>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Your Projects</h2>
          <p className="text-sm text-muted-foreground">
            Select a project to view and manage tasks, terminals, and team members
          </p>
        </div>

        <Button onClick={handleCreateClick} className="gap-2">
          <PlusCircleIcon className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Projects grid */}
      <ProjectsGrid
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={handleSelectProject}
        currentUserId={currentUserId}
        isLoading={isLoading}
        error={error}
      />

      {/* Create project card in grid */}
      {!isLoading && projects.length > 0 && (
        <Card
          className="border-dashed hover:border-primary/50 cursor-pointer transition-colors group"
          onClick={handleCreateClick}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
              <PlusCircleIcon className="h-5 w-5" />
              Create New Project
            </CardTitle>
            <CardDescription>
              Start a new project to organize your tasks and team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full group-hover:border-primary/50">
              Get Started
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create project modal */}
      <CreateProjectModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={handleProjectCreated}
      />
    </div>
  )
}
