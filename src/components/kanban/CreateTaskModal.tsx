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
import { toast } from "sonner"
import { Loader2Icon, SparklesIcon, Trash2Icon } from "lucide-react"
import type { TaskStatus } from "@/types"
import { AgentProfileSelect } from "@/components/task/AgentProfileSelect"
import { PhaseConfigPanel } from "@/components/task/PhaseConfigPanel"
import { AttachmentPreview } from "@/components/task/AttachmentPreview"
import { FileUploadButton, type UploadedFile } from "@/components/task/FileUploadButton"
import { useTaskDraft } from "@/hooks/useTaskDraft"
import { generateTaskTitle } from "@/lib/ai/generate-title"
import type { ProfileId, PhaseConfig } from "@/types/agent-profiles"
import { getDefaultPhaseConfig } from "@/lib/agent-profiles"

const createTaskSchema = z.object({
  title: z
    .string()
    .max(255, "Task title must be less than 255 characters")
    .optional(),
  description: z
    .string()
    .min(1, "Task description is required")
    .max(5000, "Description must be less than 5000 characters"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  tags: z
    .string()
    .optional(),
  branchName: z
    .string()
    .max(255, "Branch name must be less than 255 characters")
    .optional(),
})

type CreateTaskFormData = z.infer<typeof createTaskSchema>

interface TaskAttachment {
  id: string
  name: string
  type: string
  size?: number
  content: string // base64 data
  mimeType?: string
}

interface CreateTaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  onSuccess?: () => void
  defaultStatus?: TaskStatus
}

export function CreateTaskModal({
  open,
  onOpenChange,
  projectId,
  onSuccess,
  defaultStatus,
}: CreateTaskModalProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [isGeneratingTitle, setIsGeneratingTitle] = React.useState(false)
  const [profileId, setProfileId] = React.useState<ProfileId>("auto")
  const [phaseConfig, setPhaseConfig] = React.useState<PhaseConfig>(
    getDefaultPhaseConfig("auto")
  )
  const [attachments, setAttachments] = React.useState<TaskAttachment[]>([])

  const {
    draft,
    lastSaved,
    saveDraft,
    clearDraft,
  } = useTaskDraft(projectId)

  const form = useForm<CreateTaskFormData>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "MEDIUM",
      tags: "",
      branchName: "",
    },
  })

  // Use refs to capture latest values without causing re-renders
  const profileIdRef = React.useRef(profileId)
  const phaseConfigRef = React.useRef(phaseConfig)
  const attachmentsRef = React.useRef(attachments)
  const draftRef = React.useRef(draft)
  const isRestoringDraftRef = React.useRef(false)
  const hasRestoredDraftRef = React.useRef(false)

  // Keep refs in sync with state
  React.useEffect(() => {
    profileIdRef.current = profileId
  }, [profileId])

  React.useEffect(() => {
    phaseConfigRef.current = phaseConfig
  }, [phaseConfig])

  React.useEffect(() => {
    attachmentsRef.current = attachments
  }, [attachments])

  React.useEffect(() => {
    draftRef.current = draft
  }, [draft])

  // Restore draft ONCE when modal opens - only runs when modal state changes
  React.useEffect(() => {
    if (!open) {
      // Reset flags when modal closes
      hasRestoredDraftRef.current = false
      isRestoringDraftRef.current = false
      return
    }

    // Only restore if we have a draft and haven't restored yet
    const currentDraft = draftRef.current
    if (currentDraft && !hasRestoredDraftRef.current) {
      isRestoringDraftRef.current = true

      form.setValue("description", currentDraft.description || "")
      form.setValue("title", currentDraft.title || "")

      // Restore profileId and phaseConfig together
      if (currentDraft.profileId) {
        setProfileId(currentDraft.profileId)
      }
      if (currentDraft.phaseConfig) {
        setPhaseConfig(currentDraft.phaseConfig)
      }
      if (currentDraft.attachments) {
        setAttachments(currentDraft.attachments)
      }

      hasRestoredDraftRef.current = true
      // Reset the restoration flag after a tick to allow the restoration to complete
      setTimeout(() => {
        isRestoringDraftRef.current = false
      }, 0)
    }
  }, [open, form]) // Only depend on 'open' and 'form', use draftRef for draft data

  // Auto-save draft on changes - using refs to avoid infinite loop
  React.useEffect(() => {
    if (!open || isRestoringDraftRef.current) return

    const subscription = form.watch((values) => {
      saveDraft({
        description: values.description || "",
        title: values.title || "",
        profileId: profileIdRef.current,
        phaseConfig: phaseConfigRef.current,
        attachments: attachmentsRef.current,
      })
    })

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, saveDraft])

  // Update phaseConfig when profileId changes (but skip during restoration)
  React.useEffect(() => {
    if (!isRestoringDraftRef.current) {
      setPhaseConfig(getDefaultPhaseConfig(profileId))
    }
  }, [profileId])

  // Handle clipboard paste for images
  React.useEffect(() => {
    if (!open) return

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      for (let i = 0; i < items.length; i++) {
        const item = items[i]

        if (item.type.startsWith("image/")) {
          e.preventDefault()

          const file = item.getAsFile()
          if (!file) continue

          try {
            const reader = new FileReader()
            reader.onload = (event) => {
              const base64 = event.target?.result as string

              const newAttachment: TaskAttachment = {
                id: `paste-${Date.now()}-${i}`,
                name: `pasted-image-${Date.now()}.png`,
                type: item.type,
                size: file.size,
                content: base64,
                mimeType: item.type,
              }

              setAttachments(prev => [...prev, newAttachment])
              toast.success("Image pasted successfully")
            }

            reader.readAsDataURL(file)
          } catch (error) {
            console.error("Error reading pasted image:", error)
            toast.error("Failed to paste image")
          }
        }
      }
    }

    window.addEventListener("paste", handlePaste)
    return () => window.removeEventListener("paste", handlePaste)
  }, [open])

  const handleFileUpload = (files: UploadedFile[]) => {
    const newAttachments: TaskAttachment[] = files.map((file) => ({
      id: `upload-${Date.now()}-${file.name}`,
      name: file.name,
      type: file.type,
      size: file.size,
      content: file.content,
      mimeType: file.mimeType,
    }))

    setAttachments(prev => [...prev, ...newAttachments])
  }

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id))
  }

  const handleStartFresh = () => {
    form.reset()
    setProfileId("auto")
    setPhaseConfig(getDefaultPhaseConfig("auto"))
    setAttachments([])
    clearDraft()
    toast.success("Draft cleared")
  }

  const onSubmit = async (data: CreateTaskFormData) => {
    try {
      setIsLoading(true)

      let finalTitle = data.title?.trim()

      // Generate title if empty
      if (!finalTitle) {
        setIsGeneratingTitle(true)
        try {
          const result = await generateTaskTitle(data.description)

          if (result.error || !result.title) {
            throw new Error(result.error || "Failed to generate title")
          }

          finalTitle = result.title
          form.setValue("title", finalTitle)
        } catch (error) {
          setIsGeneratingTitle(false)
          setIsLoading(false)
          toast.error(error instanceof Error ? error.message : "Could not auto-generate title. Please provide one manually.")
          return
        } finally {
          setIsGeneratingTitle(false)
        }
      }

      // Convert comma-separated tags string to array
      const tagsArray = data.tags
        ? data.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
        : []

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: finalTitle,
          description: data.description,
          priority: data.priority,
          tags: tagsArray,
          branchName: data.branchName || undefined,
          projectId,
          status: defaultStatus || "PENDING",
          agentProfile: profileId,
          phaseConfig,
          attachments,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create task")
      }

      await response.json()

      toast.success("Task created successfully")
      form.reset()
      setProfileId("auto")
      setPhaseConfig(getDefaultPhaseConfig("auto"))
      setAttachments([])
      clearDraft()
      onOpenChange(false)

      if (onSuccess) {
        onSuccess()
      }

      router.refresh()
    } catch (error) {
      console.error("Error creating task:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to create task"
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate if draft was recently saved (within last 5 seconds)
  const isDraftRecentlySaved = lastSaved && Date.now() - lastSaved.getTime() < 5000

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Describe what you want to build. The AI will analyze your request and create a detailed specification.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Description First (Required) */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your task in detail. You can reference files with @filename..."
                      className="resize-none min-h-[200px]"
                      rows={8}
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Tip: Paste screenshots with ⌘V (Mac) or Ctrl+V (Windows)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Title (Optional - Auto-generated) */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Task Title
                    <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Leave empty to auto-generate from description"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription className="flex items-center gap-1">
                    <SparklesIcon className="h-3 w-3" />
                    AI will generate a title if you leave this blank
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Agent Profile Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Agent Profile
              </label>
              <AgentProfileSelect
                value={profileId}
                onChange={setProfileId}
                disabled={isLoading}
              />
              <p className="text-sm text-muted-foreground">
                Choose a specialized agent profile or let AI auto-detect the best fit
              </p>
            </div>

            {/* Phase Configuration Panel (Collapsible) */}
            <PhaseConfigPanel
              phaseConfig={phaseConfig}
              onChange={setPhaseConfig}
              disabled={isLoading}
              profileId={profileId}
            />

            {/* Priority */}
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
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

            {/* Tags */}
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="frontend, api, bug-fix (comma-separated)"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional tags separated by commas for categorization
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Branch Name */}
            <FormField
              control={form.control}
              name="branchName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="feature/user-authentication"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Git branch name for this task (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Attachment Preview */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">
                  Attachments ({attachments.length})
                </label>
                <AttachmentPreview
                  attachments={attachments}
                  onRemove={handleRemoveAttachment}
                />
              </div>
            )}

            {/* Footer with Draft Status and Actions */}
            <DialogFooter className="flex items-center justify-between sm:justify-between">
              <div className="flex items-center gap-2">
                {/* Draft Status Indicator */}
                {isDraftRecentlySaved && (
                  <span className="text-xs text-muted-foreground">
                    Draft saved
                  </span>
                )}

                {/* Start Fresh Button */}
                {draft && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleStartFresh}
                    disabled={isLoading}
                    className="h-8"
                  >
                    <Trash2Icon className="h-3 w-3 mr-1" />
                    Start Fresh
                  </Button>
                )}

                {/* File Upload Button */}
                <FileUploadButton
                  onFilesSelected={handleFileUpload}
                  disabled={isLoading}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                  className="text-muted-foreground hover:text-cyan-400 active:text-cyan-400"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || isGeneratingTitle}>
                  {(isLoading || isGeneratingTitle) && (
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isGeneratingTitle ? "Generating..." : "Create Task"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
