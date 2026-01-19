"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
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
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  Loader2Icon,
  SaveIcon,
  TrashIcon,
  AlertTriangleIcon,
} from "lucide-react"
import { TeamMembers } from "@/components/projects/team-members"

const updateProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  targetPath: z.string().optional(),
  githubRepo: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
})

type UpdateProjectFormData = z.infer<typeof updateProjectSchema>

interface Project {
  id: string
  name: string
  description: string | null
  targetPath: string | null
  githubRepo: string | null
  createdAt: string
  updatedAt: string
}

interface TeamMember {
  id: string
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER"
  user: {
    id: string
    name: string | null
    email: string | null
    image: string | null
  }
  createdAt: string
}

export default function ProjectSettingsPage() {
  const router = useRouter()
  const [project, setProject] = React.useState<Project | null>(null)
  const [members, setMembers] = React.useState<TeamMember[]>([])
  const [currentUserId, setCurrentUserId] = React.useState<string>("")
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = React.useState("")

  const form = useForm<UpdateProjectFormData>({
    resolver: zodResolver(updateProjectSchema),
    defaultValues: {
      name: "",
      description: "",
      targetPath: "",
      githubRepo: "",
    },
  })

  const fetchProject = React.useCallback(async () => {
    try {
      setIsLoading(true)

      // Get current project ID from localStorage or context
      const projectId = localStorage.getItem("currentProjectId")
      if (!projectId) {
        toast.error("No project selected")
        router.push("/dashboard")
        return
      }

      // Fetch project details
      const projectResponse = await fetch(`/api/projects/${projectId}`)
      if (!projectResponse.ok) {
        throw new Error("Failed to fetch project")
      }
      const projectData = await projectResponse.json()
      setProject(projectData)

      // Update form with project data
      form.reset({
        name: projectData.name,
        description: projectData.description || "",
        targetPath: projectData.targetPath || "",
        githubRepo: projectData.githubRepo || "",
      })

      // Fetch team members
      const membersResponse = await fetch(`/api/projects/${projectId}/members`)
      if (membersResponse.ok) {
        const membersData = await membersResponse.json()
        setMembers(membersData)
      }

      // Get current user ID from session
      const sessionResponse = await fetch("/api/auth/session")
      if (sessionResponse.ok) {
        const session = await sessionResponse.json()
        setCurrentUserId(session.user?.id || "")
      }
    } catch (error) {
      console.error("Error fetching project:", error)
      toast.error("Failed to load project settings")
    } finally {
      setIsLoading(false)
    }
  }, [form, router])

  React.useEffect(() => {
    fetchProject()
  }, [fetchProject])

  const onSubmit = async (data: UpdateProjectFormData) => {
    if (!project) return

    try {
      setIsSaving(true)

      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          description: data.description || undefined,
          targetPath: data.targetPath || undefined,
          githubRepo: data.githubRepo || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update project")
      }

      const updatedProject = await response.json()
      setProject(updatedProject)

      toast.success("Project updated successfully")
      router.refresh()
    } catch (error) {
      console.error("Error updating project:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to update project"
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteProject = async () => {
    if (!project || deleteConfirmation !== project.name) {
      toast.error("Please type the project name to confirm deletion")
      return
    }

    try {
      setIsDeleting(true)

      const response = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete project")
      }

      toast.success("Project deleted successfully")
      localStorage.removeItem("currentProjectId")

      // Notify other components (like the header) to refresh their project list
      window.dispatchEvent(new CustomEvent('projects-changed'))

      router.push("/dashboard")
    } catch (error) {
      console.error("Error deleting project:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to delete project"
      )
    } finally {
      setIsDeleting(false)
    }
  }

  const currentMember = members.find((m) => m.user.id === currentUserId)
  const canDelete = currentMember?.role === "OWNER"
  const canEdit = currentMember?.role === "OWNER" || currentMember?.role === "ADMIN"

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Project Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your project configuration and team members
        </p>
      </div>

      <Separator />

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>General Information</CardTitle>
          <CardDescription>
            Update your project name, description, and paths
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="My Awesome Project"
                        {...field}
                        disabled={isSaving || !canEdit}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="A brief description of your project..."
                        className="resize-none"
                        rows={3}
                        {...field}
                        disabled={isSaving || !canEdit}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional description to help identify this project
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetPath"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Local Directory Path</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="/path/to/project"
                        {...field}
                        disabled={isSaving || !canEdit}
                      />
                    </FormControl>
                    <FormDescription>
                      Local filesystem path where the project is located
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="githubRepo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GitHub Repository URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://github.com/username/repo"
                        {...field}
                        disabled={isSaving || !canEdit}
                      />
                    </FormControl>
                    <FormDescription>
                      Link to the GitHub repository (optional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {canEdit && (
                <div className="flex justify-end">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving && (
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <SaveIcon className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Team Members */}
      <TeamMembers
        projectId={project.id}
        members={members}
        currentUserId={currentUserId}
        onUpdate={fetchProject}
      />

      {/* Danger Zone */}
      {canDelete && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangleIcon className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions that will permanently affect this project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-1">Delete Project</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Once you delete a project, there is no going back. All tasks,
                  terminals, and associated data will be permanently deleted.
                </p>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <TrashIcon className="mr-2 h-4 w-4" />
                    Delete Project
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-3">
                      <p>
                        This action cannot be undone. This will permanently
                        delete the project and all associated data including:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>All tasks and subtasks</li>
                        <li>Terminal sessions</li>
                        <li>Git worktrees</li>
                        <li>Memory and context data</li>
                        <li>Team member associations</li>
                      </ul>
                      <p className="pt-2">
                        Please type <strong>{project.name}</strong> to confirm.
                      </p>
                      <Input
                        placeholder="Type project name"
                        value={deleteConfirmation}
                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                      />
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel
                      onClick={() => setDeleteConfirmation("")}
                    >
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteProject}
                      disabled={
                        isDeleting || deleteConfirmation !== project.name
                      }
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      {isDeleting && (
                        <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Delete Project
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
