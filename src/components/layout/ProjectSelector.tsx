"use client"

import * as React from "react"
import { FolderIcon, ChevronDownIcon, PlusIcon } from "lucide-react"
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

const PROJECTS = [
  { id: "1", name: "Auto Claude", icon: FolderIcon },
  { id: "2", name: "BookKeepingApp", icon: FolderIcon },
  { id: "3", name: "My Project", icon: FolderIcon },
]

interface ProjectSelectorProps {
  className?: string
}

function ProjectSelector({ className }: ProjectSelectorProps) {
  const [selectedProject, setSelectedProject] = React.useState(PROJECTS[0])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-10 justify-start gap-2 border-border/50 bg-card/50 hover:bg-card hover:border-border transition-colors",
            className
          )}
        >
          <FolderIcon className="size-4 text-muted-foreground" />
          <span className="font-medium">{selectedProject.name}</span>
          <ChevronDownIcon className="ml-auto size-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[240px]">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Select Project
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {PROJECTS.map((project) => {
          const Icon = project.icon
          return (
            <DropdownMenuItem
              key={project.id}
              onClick={() => setSelectedProject(project)}
              className="gap-2"
            >
              <Icon className="size-4 text-muted-foreground" />
              <span>{project.name}</span>
              {selectedProject.id === project.id && (
                <span className="ml-auto size-2 rounded-full bg-primary" />
              )}
            </DropdownMenuItem>
          )
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2 text-primary">
          <PlusIcon className="size-4" />
          <span>Create New Project</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { ProjectSelector }
export default ProjectSelector
