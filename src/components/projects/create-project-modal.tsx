"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2Icon } from "lucide-react"

const createProjectSchema = z.object({
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

type CreateProjectFormData = z.infer<typeof createProjectSchema>

interface CreateProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (projectId: string) => void
}

export function CreateProjectModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateProjectModalProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)

  const form = useForm<CreateProjectFormData>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: "",
      description: "",
      targetPath: "",
      githubRepo: "",
    },
  })

  const onSubmit = async (data: CreateProjectFormData) => {
    try {
      setIsLoading(true)

      const response = await fetch("/api/projects", {
        method: "POST",
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
        throw new Error(error.error || "Failed to create project")
      }

      const project = await response.json()

      toast.success("Project created successfully")
      form.reset()
      onOpenChange(false)

      if (onSuccess) {
        onSuccess(project.id)
      }

      router.refresh()
    } catch (error) {
      console.error("Error creating project:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to create project"
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Set up a new project to start tracking tasks and managing your
            development workflow.
          </DialogDescription>
        </DialogHeader>

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
                      disabled={isLoading}
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
                      disabled={isLoading}
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
                      disabled={isLoading}
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
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Link to the GitHub repository (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
                Create Project
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
