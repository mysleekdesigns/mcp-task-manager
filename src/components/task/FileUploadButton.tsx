"use client"

import * as React from "react"
import { Paperclip, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export interface UploadedFile {
  name: string
  type: string
  content: string
  mimeType: string
  size: number
}

interface FileUploadButtonProps {
  onFilesSelected: (files: UploadedFile[]) => void
  disabled?: boolean
  multiple?: boolean
}

const ACCEPTED_FILE_TYPES = [
  // Images
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
  // Documents
  "application/pdf",
  "text/plain",
  "text/markdown",
]

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export function FileUploadButton({
  onFilesSelected,
  disabled = false,
  multiple = true,
}: FileUploadButtonProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [isProcessing, setIsProcessing] = React.useState(false)

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])

    if (files.length === 0) {
      return
    }

    setIsProcessing(true)

    try {
      const uploadedFiles: UploadedFile[] = []

      for (const file of files) {
        // Validate file type
        if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
          toast.error(`File type not supported: ${file.name}`)
          continue
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`File too large (max 5MB): ${file.name}`)
          continue
        }

        try {
          const content = await convertToBase64(file)
          uploadedFiles.push({
            name: file.name,
            type: file.type.split("/")[0], // 'image' or 'text' or 'application'
            content,
            mimeType: file.type,
            size: file.size,
          })
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error)
          toast.error(`Failed to process: ${file.name}`)
        }
      }

      if (uploadedFiles.length > 0) {
        onFilesSelected(uploadedFiles)
        toast.success(
          `${uploadedFiles.length} file${uploadedFiles.length > 1 ? "s" : ""} uploaded`
        )
      }

      // Reset the input so the same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Error uploading files:", error)
      toast.error("Failed to upload files")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={ACCEPTED_FILE_TYPES.join(",")}
        multiple={multiple}
        onChange={handleFileChange}
        disabled={disabled || isProcessing}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleButtonClick}
        disabled={disabled || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Paperclip className="mr-2 h-4 w-4" />
            Attach Files
          </>
        )}
      </Button>
    </>
  )
}
