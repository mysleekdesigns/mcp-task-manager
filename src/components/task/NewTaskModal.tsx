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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2Icon, PlayIcon, XIcon } from "lucide-react"

const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  description: z
    .string()
    .max(2000, "Description must be less than 2000 characters")
    .optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  projectId: z.string().optional(),
})

type CreateTaskFormData = z.infer<typeof createTaskSchema>

interface NewTaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (taskId: string, shouldStart: boolean) => void
  projectId?: string
  availableProjects?: Array<{ id: string; name: string }>
  initialData?: {
    title?: string
    description?: string
    tags?: string[]
  }
}

export function NewTaskModal({
  open,
  onOpenChange,
  onSuccess,
  projectId,
  availableProjects = [],
  initialData,
}: NewTaskModalProps) {
  const router = useRouter()
  const [isCreating, setIsCreating] = React.useState(false)
  const [isCreatingAndStarting, setIsCreatingAndStarting] =
    React.useState(false)
  const [tags, setTags] = React.useState<string[]>(initialData?.tags || [])
  const [newTag, setNewTag] = React.useState("")

  const form = useForm<CreateTaskFormData>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      priority: "MEDIUM",
      projectId: projectId || (availableProjects[0]?.id ?? ""),
    },
  })

  // Update form when initialData changes
  React.useEffect(() => {
    if (initialData) {
      if (initialData.title) form.setValue("title", initialData.title)
      if (initialData.description) form.setValue("description", initialData.description)
      if (initialData.tags) setTags(initialData.tags)
    }
  }, [initialData, form])

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newTag.trim()) {
      e.preventDefault()
      if (!tags.includes(newTag.trim())) {
        setTags([...tags, newTag.trim()])
      }
      setNewTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const onSubmit = async (data: CreateTaskFormData, shouldStart: boolean) => {
    try {
      if (shouldStart) {
        setIsCreatingAndStarting(true)
      } else {
        setIsCreating(true)
      }

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: data.title,
          description: data.description || undefined,
          priority: data.priority,
          projectId: data.projectId || projectId,
          tags,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create task")
      }

      const task = await response.json()

      toast.success(
        shouldStart
          ? "Task created and starting..."
          : "Task created successfully"
      )

      form.reset()
      setTags([])
      onOpenChange(false)

      if (onSuccess) {
        onSuccess(task.id, shouldStart)
      }

      router.refresh()
    } catch (error) {
      console.error("Error creating task:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to create task"
      )
    } finally {
      setIsCreating(false)
      setIsCreatingAndStarting(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "destructive"
      case "HIGH":
        return "default"
      case "MEDIUM":
        return "secondary"
      case "LOW":
        return "outline"
      default:
        return "outline"
    }
  }

  const isLoading = isCreating || isCreatingAndStarting

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Create a new task to track your development work. You can start AI
            processing immediately or add it to the backlog.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Implement user authentication"
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
                      placeholder="Describe what needs to be done..."
                      className="resize-none"
                      rows={4}
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide context and requirements for this task
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!projectId && availableProjects.length > 0 && (
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableProjects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="space-y-2">
              <FormLabel>Tags</FormLabel>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={getPriorityColor(form.watch("priority"))}
                    className="gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:opacity-70"
                      disabled={isLoading}
                      aria-label={`Remove ${tag} tag`}
                    >
                      <XIcon className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Input
                placeholder="Type tag and press Enter..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleAddTag}
                disabled={isLoading}
              />
              <FormDescription>
                Press Enter to add tags for categorization
              </FormDescription>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={form.handleSubmit((data) => onSubmit(data, false))}
                disabled={isLoading}
              >
                {isCreating && (
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create
              </Button>
              <Button
                type="button"
                onClick={form.handleSubmit((data) => onSubmit(data, true))}
                disabled={isLoading}
              >
                {isCreatingAndStarting && (
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                )}
                {!isCreatingAndStarting && <PlayIcon className="mr-2 h-4 w-4" />}
                Create and Start
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
