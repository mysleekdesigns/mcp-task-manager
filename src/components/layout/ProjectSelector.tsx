"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { FolderIcon, ChevronDownIcon, PlusIcon, Loader2Icon } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CreateProjectModal } from "@/components/projects/create-project-modal"
import { toast } from "sonner"

interface Project {
  id: string
  name: string
  description: string | null
  targetPath: string | null
  githubRepo: string | null
  createdAt: string
  updatedAt: string
}

interface ProjectSelectorProps {
  className?: string
}

function ProjectSelector({ className }: ProjectSelectorProps) {
  const router = useRouter()
  const [projects, setProjects] = React.useState<Project[]>([])
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isOpen, setIsOpen] = React.useState(false)
  const [showCreateModal, setShowCreateModal] = React.useState(false)

  // Fetch projects on mount
  React.useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/projects")

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("API Error:", response.status, errorData)
        // If unauthorized, don't show error toast - user just needs to log in
        if (response.status === 401) {
          return
        }
        throw new Error(errorData.details || errorData.error || "Failed to fetch projects")
      }

      const data = await response.json()
      setProjects(data)

      // Set selected project from localStorage or use first project
      const storedProjectId = localStorage.getItem("currentProjectId")
      if (storedProjectId) {
        const stored = data.find((p: Project) => p.id === storedProjectId)
        if (stored) {
          setSelectedProject(stored)
        } else if (data.length > 0) {
          setSelectedProject(data[0])
          localStorage.setItem("currentProjectId", data[0].id)
        }
      } else if (data.length > 0) {
        setSelectedProject(data[0])
        localStorage.setItem("currentProjectId", data[0].id)
      }
    } catch (error) {
      console.error("Error fetching projects:", error)
      toast.error("Failed to load projects")
    } finally {
      setIsLoading(false)
    }
  }

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project)
    localStorage.setItem("currentProjectId", project.id)
    setIsOpen(false)
    router.refresh()
    toast.success(`Switched to ${project.name}`)
  }

  const handleCreateSuccess = () => {
    fetchProjects()
    // The newly created project will be selected automatically when projects refresh
  }

  if (isLoading) {
    return (
      <Button
        variant="outline"
        className={cn(
          "h-10 justify-start gap-2 border-border/50 bg-card/50",
          className
        )}
        disabled
      >
        <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
        <span className="font-medium">Loading...</span>
      </Button>
    )
  }

  if (projects.length === 0) {
    return (
      <>
        <Button
          variant="outline"
          onClick={() => setShowCreateModal(true)}
          className={cn(
            "group h-10 justify-start gap-2 border-border/50 bg-card/50 hover:bg-card hover:border-border transition-colors",
            className
          )}
        >
          <PlusIcon className="size-4 text-muted-foreground transition-colors group-hover:text-cyan-400 group-active:text-cyan-400" />
          <span className="font-medium transition-colors group-hover:text-cyan-400 group-active:text-cyan-400">Create Project</span>
        </Button>

        <CreateProjectModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          onSuccess={handleCreateSuccess}
        />
      </>
    )
  }

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "group h-10 justify-start gap-2 border-border/50 bg-card/50 hover:bg-card hover:border-border transition-colors",
              className
            )}
          >
            <FolderIcon className="size-4 text-muted-foreground transition-colors group-hover:text-cyan-400 group-data-[state=open]:text-cyan-400" />
            <span className="font-medium transition-colors group-hover:text-cyan-400 group-data-[state=open]:text-cyan-400">
              {selectedProject?.name || "Select Project"}
            </span>
            <ChevronDownIcon className="ml-auto size-4 text-muted-foreground transition-colors group-hover:text-cyan-400 group-data-[state=open]:text-cyan-400" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[240px]">
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
            Select Project
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {projects.map((project) => (
            <DropdownMenuItem
              key={project.id}
              onClick={() => handleProjectSelect(project)}
              className="gap-2"
            >
              <FolderIcon className="size-4 text-muted-foreground" />
              <span className="flex-1 truncate">{project.name}</span>
              {selectedProject?.id === project.id && (
                <span className="size-2 rounded-full bg-primary flex-shrink-0" />
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="group gap-2 text-muted-foreground hover:text-cyan-400 focus:text-cyan-400"
            onClick={() => {
              setIsOpen(false)
              setShowCreateModal(true)
            }}
          >
            <PlusIcon className="size-4 transition-colors group-hover:text-cyan-400 group-focus:text-cyan-400" />
            <span className="transition-colors group-hover:text-cyan-400 group-focus:text-cyan-400">Create New Project</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateProjectModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={handleCreateSuccess}
      />
    </>
  )
}

export { ProjectSelector }
export default ProjectSelector
