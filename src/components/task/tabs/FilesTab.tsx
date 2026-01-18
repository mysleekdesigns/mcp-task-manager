"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { FileIcon, CheckIcon, PencilIcon, TrashIcon } from "lucide-react"

type FileAction = "created" | "modified" | "deleted"

interface ModifiedFile {
  id: string
  path: string
  action: FileAction
  linesAdded?: number
  linesRemoved?: number
}

interface FilesTabProps {
  files: ModifiedFile[]
}

export function FilesTab({ files }: FilesTabProps) {
  const getActionIcon = (action: FileAction) => {
    switch (action) {
      case "created":
        return <CheckIcon className="size-4 text-green-500" />
      case "modified":
        return <PencilIcon className="size-4 text-blue-500" />
      case "deleted":
        return <TrashIcon className="size-4 text-destructive" />
    }
  }

  const getActionBadge = (action: FileAction) => {
    switch (action) {
      case "created":
        return (
          <Badge variant="outline" className="text-green-600">
            Created
          </Badge>
        )
      case "modified":
        return (
          <Badge variant="outline" className="text-blue-600">
            Modified
          </Badge>
        )
      case "deleted":
        return <Badge variant="destructive">Deleted</Badge>
    }
  }

  const groupedFiles = React.useMemo(() => {
    const groups: Record<FileAction, ModifiedFile[]> = {
      created: [],
      modified: [],
      deleted: [],
    }

    files.forEach((file) => {
      groups[file.action].push(file)
    })

    return groups
  }, [files])

  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No files modified yet. Files will appear when changes are made.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-sm">
        <span className="text-muted-foreground">Total files:</span>
        <Badge variant="outline">{files.length}</Badge>
        {groupedFiles.created.length > 0 && (
          <Badge variant="outline" className="text-green-600">
            {groupedFiles.created.length} created
          </Badge>
        )}
        {groupedFiles.modified.length > 0 && (
          <Badge variant="outline" className="text-blue-600">
            {groupedFiles.modified.length} modified
          </Badge>
        )}
        {groupedFiles.deleted.length > 0 && (
          <Badge variant="destructive">
            {groupedFiles.deleted.length} deleted
          </Badge>
        )}
      </div>

      <div className="space-y-1">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center gap-3 p-3 rounded-md border bg-card hover:bg-accent/50 transition-colors"
          >
            <FileIcon className="size-4 text-muted-foreground shrink-0" />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {getActionIcon(file.action)}
                <span
                  className={`text-sm font-mono truncate ${
                    file.action === "deleted"
                      ? "line-through text-muted-foreground"
                      : "text-foreground"
                  }`}
                  title={file.path}
                >
                  {file.path}
                </span>
              </div>

              {file.action === "modified" &&
                (file.linesAdded !== undefined ||
                  file.linesRemoved !== undefined) && (
                  <div className="flex items-center gap-2 mt-1 text-xs">
                    {file.linesAdded !== undefined && file.linesAdded > 0 && (
                      <span className="text-green-600">
                        +{file.linesAdded}
                      </span>
                    )}
                    {file.linesRemoved !== undefined &&
                      file.linesRemoved > 0 && (
                        <span className="text-destructive">
                          -{file.linesRemoved}
                        </span>
                      )}
                  </div>
                )}
            </div>

            {getActionBadge(file.action)}
          </div>
        ))}
      </div>
    </div>
  )
}
