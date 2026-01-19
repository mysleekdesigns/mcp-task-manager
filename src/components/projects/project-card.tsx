"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2Icon, FolderIcon, UsersIcon, ClipboardListIcon } from "lucide-react"

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

interface ProjectCardProps {
  project: Project
  isSelected: boolean
  onSelect: (projectId: string) => void
  currentUserId?: string
}

const ROLE_COLORS = {
  OWNER: "bg-primary/10 text-primary border-primary/20",
  ADMIN: "bg-secondary/10 text-secondary border-secondary/20",
  MEMBER: "bg-muted text-muted-foreground border-border",
  VIEWER: "bg-muted/50 text-muted-foreground border-border/50",
}

const ROLE_LABELS = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
  VIEWER: "Viewer",
}

export function ProjectCard({ project, isSelected, onSelect, currentUserId }: ProjectCardProps) {
  const userMembership = project.members.find((m) => m.user.id === currentUserId)
  const userRole = userMembership?.role || "VIEWER"

  const handleClick = () => {
    onSelect(project.id)
  }

  const truncateDescription = (text: string | null, maxLength: number = 120) => {
    if (!text) return null
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength).trim() + "..."
  }

  return (
    <Card
      className={`group relative transition-all duration-200 hover:shadow-lg cursor-pointer ${
        isSelected
          ? "ring-2 ring-primary shadow-lg border-primary/50"
          : "hover:border-primary/30"
      }`}
      onClick={handleClick}
    >
      {isSelected && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="bg-primary text-primary-foreground rounded-full p-1 shadow-md">
            <CheckCircle2Icon className="h-4 w-4" />
          </div>
        </div>
      )}

      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="shrink-0">
              <FolderIcon className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg font-semibold truncate">
              {project.name}
            </CardTitle>
          </div>
          <Badge
            variant="outline"
            className={`shrink-0 ${ROLE_COLORS[userRole]}`}
          >
            {ROLE_LABELS[userRole]}
          </Badge>
        </div>

        {project.description && (
          <CardDescription className="line-clamp-2 text-sm">
            {truncateDescription(project.description)}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <ClipboardListIcon className="h-3 w-3" />
            <span>{project._count.tasks} tasks</span>
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <UsersIcon className="h-3 w-3" />
            <span>{project.members.length} members</span>
          </Badge>
        </div>

        {project.targetPath && (
          <div className="text-xs text-muted-foreground font-mono truncate bg-muted/50 px-2 py-1 rounded">
            {project.targetPath}
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          variant={isSelected ? "default" : "outline"}
          onClick={(e) => {
            e.stopPropagation()
            handleClick()
          }}
        >
          {isSelected ? "Selected" : "Select Project"}
        </Button>
      </CardFooter>
    </Card>
  )
}
