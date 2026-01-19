'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { Trash2, FolderOpen, AlertTriangle, Loader2 } from 'lucide-react'

interface ProjectMember {
  userId: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'
  user: {
    id: string
    name: string | null
    email: string | null
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
  updatedAt: string
  members: ProjectMember[]
  _count: {
    tasks: number
    terminals: number
    worktrees: number
  }
}

export function ProjectsSection() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (!response.ok) throw new Error('Failed to fetch projects')

      const data = await response.json()
      setProjects(data)
    } catch (error) {
      console.error('Error fetching projects:', error)
      toast.error('Failed to load projects')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    setDeletingProjectId(projectId)
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete project')
      }

      // Remove the deleted project from the list
      setProjects(prev => prev.filter(p => p.id !== projectId))
      toast.success(`Project "${projectName}" has been deleted`)
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete project')
    } finally {
      setDeletingProjectId(null)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            <div>
              <CardTitle>Your Projects</CardTitle>
              <CardDescription>
                Manage and view your projects. You can only delete projects you own.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              You don&apos;t have any projects yet.
            </p>
          ) : (
            <div className="space-y-4">
              {projects.map(project => {
                const isOwner = project.members.some(m => m.role === 'OWNER')
                const isDeleting = deletingProjectId === project.id

                return (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{project.name}</span>
                        {isOwner && (
                          <Badge variant="outline" className="text-xs">Owner</Badge>
                        )}
                      </div>
                      {project.description && (
                        <p className="text-sm text-muted-foreground">
                          {project.description}
                        </p>
                      )}
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>{project._count.tasks} tasks</span>
                        <span>{project._count.terminals} terminals</span>
                        <span>{project._count.worktrees} worktrees</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isOwner ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={isDeleting}
                            >
                              {isDeleting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                              <span className="ml-1">Delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-destructive" />
                                Delete Project
                              </AlertDialogTitle>
                              <AlertDialogDescription asChild>
                                <div className="text-muted-foreground text-sm">
                                  <p>
                                    Are you sure you want to delete <strong>&quot;{project.name}&quot;</strong>?
                                    This action cannot be undone and will permanently delete:
                                  </p>
                                  <ul className="mt-2 ml-4 list-disc space-y-1">
                                    <li>{project._count.tasks} tasks</li>
                                    <li>{project._count.terminals} terminal sessions</li>
                                    <li>{project._count.worktrees} worktrees</li>
                                    <li>All associated data including memories, features, phases, and MCP configs</li>
                                  </ul>
                                </div>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteProject(project.id, project.name)}
                                className="bg-destructive text-white hover:bg-destructive/90"
                              >
                                Delete Project
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Only owners can delete
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible and destructive actions. Please proceed with caution.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Project deletion is permanent and cannot be undone. When you delete a project,
            all tasks, terminal sessions, worktrees, memories, features, phases, milestones,
            and MCP configurations associated with that project will also be deleted.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Only project owners can delete their projects. If you need to leave a project
            without deleting it, please contact the project owner.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
