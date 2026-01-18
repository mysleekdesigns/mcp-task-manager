"use client"

import * as React from "react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { XIcon } from "lucide-react"

interface OverviewTabProps {
  description: string
  onDescriptionChange: (value: string) => void
  assigneeId: string | null
  onAssigneeChange: (value: string) => void
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  onPriorityChange: (value: "LOW" | "MEDIUM" | "HIGH" | "URGENT") => void
  tags: string[]
  onTagsChange: (tags: string[]) => void
  isEditing: boolean
  availableAssignees?: Array<{ id: string; name: string | null; email: string }>
}

export function OverviewTab({
  description,
  onDescriptionChange,
  assigneeId,
  onAssigneeChange,
  priority,
  onPriorityChange,
  tags,
  onTagsChange,
  isEditing,
  availableAssignees = [],
}: OverviewTabProps) {
  const [newTag, setNewTag] = React.useState("")

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newTag.trim()) {
      e.preventDefault()
      if (!tags.includes(newTag.trim())) {
        onTagsChange([...tags, newTag.trim()])
      }
      setNewTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove))
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

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Enter task description..."
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          disabled={!isEditing}
          rows={6}
          className="resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="assignee">Assignee</Label>
          <Select
            value={assigneeId || "unassigned"}
            onValueChange={(value) =>
              onAssigneeChange(value === "unassigned" ? "" : value)
            }
            disabled={!isEditing}
          >
            <SelectTrigger id="assignee" className="w-full">
              <SelectValue placeholder="Select assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {availableAssignees.map((assignee) => (
                <SelectItem key={assignee.id} value={assignee.id}>
                  {assignee.name || assignee.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select
            value={priority}
            onValueChange={onPriorityChange}
            disabled={!isEditing}
          >
            <SelectTrigger id="priority" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant={getPriorityColor(priority)}
              className="gap-1"
            >
              {tag}
              {isEditing && (
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:opacity-70"
                  aria-label={`Remove ${tag} tag`}
                >
                  <XIcon className="size-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
        {isEditing && (
          <Input
            id="tags"
            placeholder="Type tag and press Enter..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={handleAddTag}
          />
        )}
      </div>
    </div>
  )
}
