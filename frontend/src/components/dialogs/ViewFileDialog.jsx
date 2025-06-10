import * as React from "react"
import { ExternalLink, Edit, Trash2, File, FileText, Folder, ImageIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { format, parseISO } from "date-fns"

const getFileIcon = (mimeType) => {
  if (mimeType?.includes('folder')) {
    return <Folder className="h-5 w-5 text-blue-500" />
  }
  if (mimeType?.includes('document') || mimeType?.includes('text')) {
    return <FileText className="h-5 w-5 text-green-500" />
  }
  if (mimeType?.includes('image')) {
    return <ImageIcon className="h-5 w-5 text-purple-500" />
  }
  if (mimeType?.includes('spreadsheet')) {
    return <FileText className="h-5 w-5 text-emerald-500" />
  }
  if (mimeType?.includes('presentation')) {
    return <FileText className="h-5 w-5 text-orange-500" />
  }
  return <File className="h-5 w-5 text-gray-500" />
}

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "Unknown size"
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

const formatDate = (dateString) => {
  try {
    const date = parseISO(dateString)
    return format(date, "PPpp") // Example: "Apr 29, 2023 at 3:00 PM"
  } catch (error) {
    return dateString
  }
}

export function ViewFileDialog({ 
  open, 
  onOpenChange, 
  file, 
  onEdit, 
  onDelete 
}) {
  if (!file) return null

  const handleEdit = () => {
    onEdit?.(file)
    onOpenChange(false)
  }

  const handleDelete = () => {
    onDelete?.(file)
    onOpenChange(false)
  }

  const handleOpenInDrive = () => {
    if (file.webViewLink) {
      window.open(file.webViewLink, '_blank')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getFileIcon(file.mimeType)}
            {file.name}
          </DialogTitle>
          <DialogDescription>
            File details and metadata
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Type Badge */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Type:</span>
            <Badge variant="outline">
              {file.fileType || 'drive'}
            </Badge>
          </div>

          <Separator />

          {/* File Information */}
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="font-medium text-muted-foreground">Size:</span>
              <span>{formatFileSize(file.size)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="font-medium text-muted-foreground">Created:</span>
              <span>{formatDate(file.createdTime)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="font-medium text-muted-foreground">Modified:</span>
              <span>{formatDate(file.modifiedTime)}</span>
            </div>

            {file.isShared && (
              <div className="flex justify-between">
                <span className="font-medium text-muted-foreground">Shared:</span>
                <Badge variant="secondary" className="text-xs">
                  Yes
                </Badge>
              </div>
            )}

            {file.googleId && (
              <div className="flex justify-between">
                <span className="font-medium text-muted-foreground">Google ID:</span>
                <span className="font-mono text-xs">{file.googleId}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleEdit}
              className="flex-1"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="flex-1"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ViewFileDialog 