"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { OverviewTab } from "./tabs/OverviewTab"
import { SubtasksTab } from "./tabs/SubtasksTab"
import { LogsTab } from "./tabs/LogsTab"
import { FilesTab } from "./tabs/FilesTab"
import {
  PencilIcon,
  SaveIcon,
  XIcon,
  Loader2Icon,
  StopCircleIcon,
  TrashIcon,
} from "lucide-react"
import { toast } from "sonner"

interface Subtask {
  id: string
  title: string
  completed: boolean
}

interface LogEntry {
  id: string
  type: "phase_start" | "file_read" | "file_write" | "ai_response" | "command" | "error"
  message: string
  output?: string
  timestamp: Date
}

interface PhaseLog {
  name: string
  status: "pending" | "in_progress" | "completed" | "failed"
  model?: string
  logs: LogEntry[]
}

interface ModifiedFile {
  id: string
  path: string
  action: "created" | "modified" | "deleted"
  linesAdded?: number
  linesRemoved?: number
}

interface Task {
  id: string
  title: string
  description: string
  branchName?: string
  status: string
  assigneeId: string | null
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  tags: string[]
  subtasks?: Subtask[]
  phaseLogs?: PhaseLog[]
  modifiedFiles?: ModifiedFile[]
  isRunning?: boolean
}

interface TaskModalProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate?: (task: Task) => void
  onDelete?: (taskId: string) => void
  onStop?: (taskId: string) => void
  availableAssignees?: Array<{ id: string; name: string | null; email: string }>
}

export function TaskModal({
  task,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
  onStop,
  availableAssignees = [],
}: TaskModalProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)

  const [editedTitle, setEditedTitle] = React.useState("")
  const [editedDescription, setEditedDescription] = React.useState("")
  const [editedAssigneeId, setEditedAssigneeId] = React.useState<string | null>(
    null
  )
  const [editedPriority, setEditedPriority] = React.useState<
    "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  >("MEDIUM")
  const [editedTags, setEditedTags] = React.useState<string[]>([])
  const [editedSubtasks, setEditedSubtasks] = React.useState<Subtask[]>([])

  React.useEffect(() => {
    if (task) {
      setEditedTitle(task.title)
      setEditedDescription(task.description)
      setEditedAssigneeId(task.assigneeId)
      setEditedPriority(task.priority)
      setEditedTags(task.tags)
      setEditedSubtasks(task.subtasks || [])
      setIsEditing(false)
    }
  }, [task])

  const handleSave = async () => {
    if (!task || !editedTitle.trim()) {
      toast.error("Title is required")
      return
    }

    setIsSaving(true)
    try {
      const updatedTask: Task = {
        ...task,
        title: editedTitle,
        description: editedDescription,
        assigneeId: editedAssigneeId,
        priority: editedPriority,
        tags: editedTags,
        subtasks: editedSubtasks,
      }

      await onUpdate?.(updatedTask)
      setIsEditing(false)
      toast.success("Task updated successfully")
    } catch (error) {
      console.error("Error updating task:", error)
      toast.error("Failed to update task")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (task) {
      setEditedTitle(task.title)
      setEditedDescription(task.description)
      setEditedAssigneeId(task.assigneeId)
      setEditedPriority(task.priority)
      setEditedTags(task.tags)
      setEditedSubtasks(task.subtasks || [])
    }
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (!task) return

    try {
      await onDelete?.(task.id)
      setShowDeleteDialog(false)
      onOpenChange(false)
      toast.success("Task deleted successfully")
    } catch (error) {
      console.error("Error deleting task:", error)
      toast.error("Failed to delete task")
    }
  }

  const handleStop = async () => {
    if (!task) return

    try {
      await onStop?.(task.id)
      toast.success("Task stopped successfully")
    } catch (error) {
      console.error("Error stopping task:", error)
      toast.error("Failed to stop task")
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
    > = {
      PENDING: { label: "Pending", variant: "outline" },
      PLANNING: { label: "Planning", variant: "secondary" },
      IN_PROGRESS: { label: "In Progress", variant: "default" },
      AI_REVIEW: { label: "AI Review", variant: "secondary" },
      HUMAN_REVIEW: { label: "Human Review", variant: "secondary" },
      COMPLETED: { label: "Completed", variant: "default" },
      CANCELLED: { label: "Cancelled", variant: "destructive" },
    }

    const config = statusConfig[status] || {
      label: status,
      variant: "outline" as const,
    }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (!task) return null

  const subtaskCount = task.subtasks?.length || 0

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader className="space-y-3">
            <div className="flex items-start gap-3">
              {isEditing ? (
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="text-lg font-semibold flex-1"
                  placeholder="Task title..."
                />
              ) : (
                <DialogTitle className="flex-1">{task.title}</DialogTitle>
              )}

              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Button
                      size="icon-sm"
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader2Icon className="size-4 animate-spin" />
                      ) : (
                        <SaveIcon className="size-4" />
                      )}
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <XIcon className="size-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    size="icon-sm"
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                  >
                    <PencilIcon className="size-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {task.branchName && (
                <Badge variant="outline" className="font-mono text-xs">
                  {task.branchName}
                </Badge>
              )}
              {getStatusBadge(task.status)}
            </div>
          </DialogHeader>

          <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="subtasks">
                Subtasks {subtaskCount > 0 && `(${subtaskCount})`}
              </TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto mt-4">
              <TabsContent value="overview" className="mt-0">
                <OverviewTab
                  description={editedDescription}
                  onDescriptionChange={setEditedDescription}
                  assigneeId={editedAssigneeId}
                  onAssigneeChange={setEditedAssigneeId}
                  priority={editedPriority}
                  onPriorityChange={setEditedPriority}
                  tags={editedTags}
                  onTagsChange={setEditedTags}
                  isEditing={isEditing}
                  availableAssignees={availableAssignees}
                />
              </TabsContent>

              <TabsContent value="subtasks" className="mt-0">
                <SubtasksTab
                  subtasks={editedSubtasks}
                  onSubtasksChange={setEditedSubtasks}
                  isEditing={isEditing}
                />
              </TabsContent>

              <TabsContent value="logs" className="mt-0">
                <LogsTab phaseLogs={task.phaseLogs || []} />
              </TabsContent>

              <TabsContent value="files" className="mt-0">
                <FilesTab files={task.modifiedFiles || []} />
              </TabsContent>
            </div>
          </Tabs>

          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <TrashIcon className="size-4 mr-2" />
              Delete Task
            </Button>

            <div className="flex gap-2">
              {task.isRunning && (
                <Button variant="outline" onClick={handleStop}>
                  <StopCircleIcon className="size-4 mr-2" />
                  Stop Task
                </Button>
              )}
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              task and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
