"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckIcon, PlusIcon, TrashIcon } from "lucide-react"

interface Subtask {
  id: string
  title: string
  completed: boolean
}

interface SubtasksTabProps {
  subtasks: Subtask[]
  onSubtasksChange: (subtasks: Subtask[]) => void
  isEditing: boolean
}

export function SubtasksTab({
  subtasks,
  onSubtasksChange,
  isEditing,
}: SubtasksTabProps) {
  const [newSubtaskTitle, setNewSubtaskTitle] = React.useState("")

  const handleAddSubtask = () => {
    if (newSubtaskTitle.trim()) {
      const newSubtask: Subtask = {
        id: crypto.randomUUID(),
        title: newSubtaskTitle.trim(),
        completed: false,
      }
      onSubtasksChange([...subtasks, newSubtask])
      setNewSubtaskTitle("")
    }
  }

  const handleToggleSubtask = (subtaskId: string) => {
    onSubtasksChange(
      subtasks.map((subtask) =>
        subtask.id === subtaskId
          ? { ...subtask, completed: !subtask.completed }
          : subtask
      )
    )
  }

  const handleDeleteSubtask = (subtaskId: string) => {
    onSubtasksChange(subtasks.filter((subtask) => subtask.id !== subtaskId))
  }

  const completedCount = subtasks.filter((s) => s.completed).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          Progress: {completedCount} of {subtasks.length} completed
        </h3>
        {subtasks.length > 0 && (
          <Badge variant="outline">
            {Math.round((completedCount / subtasks.length) * 100)}%
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        {subtasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No subtasks yet. Add one below to get started.
          </div>
        ) : (
          subtasks.map((subtask) => (
            <div
              key={subtask.id}
              className="flex items-center gap-2 p-3 rounded-md border bg-card hover:bg-accent/50 transition-colors"
            >
              <button
                type="button"
                onClick={() => handleToggleSubtask(subtask.id)}
                disabled={!isEditing}
                className="flex items-center justify-center size-5 rounded border-2 border-primary disabled:opacity-50 hover:bg-primary/10 transition-colors"
                aria-label={
                  subtask.completed
                    ? "Mark as incomplete"
                    : "Mark as complete"
                }
              >
                {subtask.completed && (
                  <CheckIcon className="size-3 text-primary" />
                )}
              </button>

              <span
                className={`flex-1 text-sm ${
                  subtask.completed
                    ? "line-through text-muted-foreground"
                    : "text-foreground"
                }`}
              >
                {subtask.title}
              </span>

              {isEditing && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDeleteSubtask(subtask.id)}
                  aria-label="Delete subtask"
                >
                  <TrashIcon className="size-4 text-destructive" />
                </Button>
              )}
            </div>
          ))
        )}
      </div>

      {isEditing && (
        <div className="flex gap-2">
          <Input
            placeholder="Add a new subtask..."
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleAddSubtask()
              }
            }}
          />
          <Button
            type="button"
            onClick={handleAddSubtask}
            disabled={!newSubtaskTitle.trim()}
            size="icon"
          >
            <PlusIcon className="size-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
