"use client"

import * as React from "react"
import { X, FileText, File } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface Attachment {
  id: string
  type: string
  name: string
  content: string
  mimeType?: string
}

interface AttachmentPreviewProps {
  attachments: Attachment[]
  onRemove: (id: string) => void
}

export function AttachmentPreview({
  attachments,
  onRemove,
}: AttachmentPreviewProps) {
  if (attachments.length === 0) {
    return null
  }

  const isImage = (mimeType?: string) => {
    return mimeType?.startsWith("image/")
  }

  const getFileIcon = (mimeType?: string, name?: string) => {
    if (name?.endsWith(".pdf")) {
      return <FileText className="size-8 text-red-500" />
    }
    if (name?.endsWith(".md") || name?.endsWith(".txt")) {
      return <FileText className="size-8 text-blue-500" />
    }
    return <File className="size-8 text-muted-foreground" />
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">Attachments ({attachments.length})</div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className={cn(
              "group relative overflow-hidden rounded-lg border bg-muted/30",
              "hover:border-primary/50 transition-colors"
            )}
          >
            <div className="aspect-square flex items-center justify-center p-3">
              {isImage(attachment.mimeType) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={attachment.content}
                  alt={attachment.name}
                  className="h-full w-full object-cover rounded"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2">
                  {getFileIcon(attachment.mimeType, attachment.name)}
                  <div className="text-xs text-center text-muted-foreground truncate w-full px-2">
                    {attachment.name}
                  </div>
                </div>
              )}
            </div>

            <Button
              type="button"
              variant="destructive"
              size="icon-sm"
              className={cn(
                "absolute top-1 right-1 size-6",
                "opacity-0 group-hover:opacity-100 transition-opacity",
                "shadow-md"
              )}
              onClick={() => onRemove(attachment.id)}
              aria-label={`Remove ${attachment.name}`}
            >
              <X className="size-3" />
            </Button>

            {isImage(attachment.mimeType) && (
              <div className={cn(
                "absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1.5 truncate",
                "opacity-0 group-hover:opacity-100 transition-opacity"
              )}>
                {attachment.name}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
