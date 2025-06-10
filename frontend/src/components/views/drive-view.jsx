import React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { File, FileText, Folder, ImageIcon, MoreHorizontal, RefreshCw, AlertCircle, Eye, Edit3, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useDriveFiles, useSyncDriveFiles, useUpdateDriveFile, useDeleteDriveFile } from "@/hooks/useDriveFiles"
import { useUrlPagination } from "@/hooks/useUrlPagination"
import { Skeleton } from "@/components/ui/skeleton"
import { UrlPagination } from "@/components/ui/url-pagination"
import { format, isToday, isYesterday, parseISO } from "date-fns"
import { Alert, AlertDescription } from "@/components/ui/alert"
import ViewFileDialog from "@/components/dialogs/ViewFileDialog"
import EditFileDialog from "@/components/dialogs/EditFileDialog"
import ConfirmDialog from "@/components/ui/confirm-dialog"

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
  if (!bytes || bytes === 0) return "--"
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

const formatDate = (dateString) => {
  try {
    const date = parseISO(dateString)
    if (isToday(date)) {
      return format(date, "h:mm a")
    } else if (isYesterday(date)) {
      return "Yesterday"
    } else {
      return format(date, "MMM d, yyyy")
    }
  } catch (error) {
    return dateString
  }
}

export default function DriveView() {
  
  // Use URL-based pagination - single source of truth
  const { pagination } = useUrlPagination({ page: 1, limit: 10 })
  
  // Fetch Drive files with React Query
  const { 
    data, 
    isLoading, 
    isError, 
    error 
  } = useDriveFiles(pagination)
  
  // Mutations
  const { 
    mutate: syncFiles, 
    isPending: isSyncing 
  } = useSyncDriveFiles()
  
  const { 
    mutate: updateFile, 
    isPending: isUpdating 
  } = useUpdateDriveFile()
  
  const { 
    mutate: deleteFile, 
    isPending: isDeleting 
  } = useDeleteDriveFile()
  
  // Dialog states
  const [viewDialog, setViewDialog] = React.useState({ open: false, file: null })
  const [editDialog, setEditDialog] = React.useState({ open: false, file: null })
  const [deleteDialog, setDeleteDialog] = React.useState({ open: false, file: null })
  
  // Handle refresh
  const handleRefresh = () => {
    syncFiles()
  }
  
  // Handle file actions
  const handleViewFile = (file) => {
    setViewDialog({ open: true, file })
  }
  
  const handleEditFile = (file) => {
    setEditDialog({ open: true, file })
  }
  
  const handleDeleteFile = (file) => {
    setDeleteDialog({ open: true, file })
  }
  
  const handleSaveFile = (fileData) => {
    updateFile(
      { id: fileData.id, data: { name: fileData.name } },
      {
        onSuccess: () => {
          setEditDialog({ open: false, file: null })
        },
        onError: (error) => {
          console.error('Failed to update file:', error)
          // Keep dialog open on error so user can retry
        }
      }
    )
  }
  
  const handleConfirmDelete = () => {
    if (deleteDialog.file) {
      deleteFile(deleteDialog.file.id, {
        onSuccess: () => {
          setDeleteDialog({ open: false, file: null })
        },
        onError: (error) => {
          console.error('Failed to delete file:', error)
          // Keep dialog open on error so user can retry
        }
      })
    }
  }
  
  // Handle file action
  const handleFileAction = (action, file) => {
    switch (action) {
      case 'view':
        handleViewFile(file)
        break
      case 'rename':
        handleEditFile(file)
        break
      case 'delete':
        handleDeleteFile(file)
        break
      default:
        break
    }
  }
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="p-4 md:p-6 w-full max-w-full">
        <Card className="w-full">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 space-y-2 sm:space-y-0">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-5 w-20" />
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pb-4">
              <Skeleton className="h-10 flex-1" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // Render error state
  if (isError) {
    return (
      <div className="p-4 md:p-6 w-full max-w-full">
        <Card className="w-full">
          <CardContent className="p-4 md:p-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load Drive files: {error?.message || 'Unknown error'}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  const files = data?.files || []

  return (
    <div className="p-4 md:p-6 w-full max-w-full">
      <Card className="w-full">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 space-y-2 sm:space-y-0">
          <CardTitle className="text-lg md:text-xl">Google Drive</CardTitle>
          <Badge variant="outline" className="text-sm w-fit">
            {files.length} items
          </Badge>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center gap-2 justify-end pb-4">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleRefresh}
              disabled={isSyncing}
              className="shrink-0"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {files.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No files found</p>
              <Button 
                onClick={handleRefresh} 
                variant="outline" 
                className="mt-4"
                disabled={isSyncing}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                Sync from Google Drive
              </Button>
            </div>
          ) : (
            <div className="w-full overflow-hidden">
              {/* Desktop Table View */}
              <div className="hidden md:block rounded-md border">
                <div className="w-full overflow-x-auto">
                  <Table className="w-full table-fixed">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">Name</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Modified</TableHead>
                        <TableHead className="w-[100px]">Type</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {files.map((file) => (
                        <TableRow key={file.id || file.googleId}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getFileIcon(file.mimeType)}
                              <span className="truncate" title={file.name}>
                                {file.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{formatFileSize(file.size)}</TableCell>
                          <TableCell>{formatDate(file.modifiedAt || file.lastModified)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {file.mimeType?.includes('folder') ? 'Folder' :
                               file.mimeType?.includes('document') ? 'Doc' :
                               file.mimeType?.includes('spreadsheet') ? 'Sheet' :
                               file.mimeType?.includes('presentation') ? 'Slides' :
                               file.mimeType?.includes('image') ? 'Image' :
                               'File'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="cursor-pointer">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleFileAction('view', file)} className="cursor-pointer">
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleFileAction('rename', file)} className="cursor-pointer">
                                  <Edit3 className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleFileAction('delete', file)}
                                  className="text-destructive focus:text-destructive cursor-pointer"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {files.map((file) => (
                  <Card 
                    key={file.id || file.googleId} 
                    className="border-l-4 border-l-blue-500 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {getFileIcon(file.mimeType)}
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate text-sm" title={file.name}>
                              {file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(file.modifiedAt || file.lastModified)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-2 shrink-0">
                          <Badge variant="secondary" className="text-xs">
                            {file.mimeType?.includes('folder') ? 'Folder' :
                             file.mimeType?.includes('document') ? 'Doc' :
                             file.mimeType?.includes('spreadsheet') ? 'Sheet' :
                             file.mimeType?.includes('presentation') ? 'Slides' :
                             file.mimeType?.includes('image') ? 'Image' :
                             'File'}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 cursor-pointer">
                                <MoreHorizontal className="h-3 w-3" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleFileAction('view', file)} className="cursor-pointer">
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleFileAction('rename', file)} className="cursor-pointer">
                                <Edit3 className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleFileAction('delete', file)}
                                className="text-destructive focus:text-destructive cursor-pointer"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-muted-foreground">
                          Size: {formatFileSize(file.size)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Pagination */}
              {data?.pagination && (
                <UrlPagination 
                  total={data.pagination.total}
                  totalPages={data.pagination.totalPages}
                  className="mt-4"
                  itemLabel="files"
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ViewFileDialog
        open={viewDialog.open}
        onOpenChange={(open) => setViewDialog({ open, file: open ? viewDialog.file : null })}
        file={viewDialog.file}
        onEdit={handleEditFile}
        onDelete={handleDeleteFile}
      />

      <EditFileDialog
        open={editDialog.open}
        onOpenChange={(open) => setEditDialog({ open, file: open ? editDialog.file : null })}
        file={editDialog.file}
        onSave={handleSaveFile}
        loading={isUpdating}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, file: open ? deleteDialog.file : null })}
        title="Delete File"
        description={`Are you sure you want to delete "${deleteDialog.file?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        destructive={true}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
      />
    </div>
  );
}
