import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.jsx";
import { Button } from "@/components/ui/button.jsx";
import { RefreshCw, AlertCircle, MoreHorizontal, Eye, Edit3, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu.jsx";
import {
  useGmailMessagesWithPagination,
  useSyncGmailMessages,
  useUpdateGmailMessage,
  useDeleteGmailMessage
} from "@/hooks/useGmailMessages.js";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import { UrlPagination } from "@/components/ui/url-pagination.jsx";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import ViewMessageDialog from "@/components/dialogs/ViewMessageDialog.jsx";
import EditMessageDialog from "@/components/dialogs/EditMessageDialog.jsx";
import ConfirmDialog from "@/components/ui/confirm-dialog.jsx";

export default function GmailPage() {
  // Fetch Gmail messages with built-in pagination
  const { data, isLoading, isError, error, pagination } = useGmailMessagesWithPagination();

  // Mutations
  const { mutate: syncEmails, isPending: isSyncing } = useSyncGmailMessages();

  const { mutate: updateMessage, isPending: isUpdating } = useUpdateGmailMessage();

  const { mutate: deleteMessage, isPending: isDeleting } = useDeleteGmailMessage();

  // Dialog states
  const [viewDialog, setViewDialog] = React.useState({ open: false, message: null });
  const [editDialog, setEditDialog] = React.useState({ open: false, message: null });
  const [deleteDialog, setDeleteDialog] = React.useState({ open: false, message: null });

  // Format date for display
  const formatDate = dateString => {
    try {
      const date = parseISO(dateString);
      if (isToday(date)) {
        return format(date, "h:mm a");
      } else if (isYesterday(date)) {
        return "Yesterday";
      } else {
        return format(date, "MMM d");
      }
    } catch (error) {
      return dateString;
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    syncEmails();
  };

  // Handle message actions
  const handleViewMessage = message => {
    setViewDialog({ open: true, message });
  };

  const handleEditMessage = message => {
    setEditDialog({ open: true, message });
  };

  const handleDeleteMessage = message => {
    setDeleteDialog({ open: true, message });
  };

  const handleMessageAction = (action, message) => {
    switch (action) {
      case "view":
        handleViewMessage(message);
        break;
      case "edit":
        handleEditMessage(message);
        break;
      case "delete":
        handleDeleteMessage(message);
        break;
      default:
        break;
    }
  };

  const handleSaveMessage = messageData => {
    updateMessage(
      {
        id: messageData.id,
        data: {
          subject: messageData.subject
        }
      },
      {
        onSuccess: () => {
          setEditDialog({ open: false, message: null });
        },
        onError: error => {
          console.error("Failed to update message:", error);
          // Keep dialog open on error so user can retry
        }
      }
    );
  };

  const handleConfirmDelete = () => {
    if (deleteDialog.message) {
      deleteMessage(deleteDialog.message.id, {
        onSuccess: () => {
          setDeleteDialog({ open: false, message: null });
        },
        onError: error => {
          console.error("Failed to delete message:", error);
          // Keep dialog open on error so user can retry
        }
      });
    }
  };

  // Get unread count
  const unreadCount = data?.messages?.filter(email => !email.isRead).length || 0;

  // Render loading state
  if (isLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Gmail</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 pb-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render error state
  if (isError) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Gmail</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <AlertCircle className="h-10 w-10 text-destructive mb-4" />
              <h3 className="text-lg font-semibold">Failed to load emails</h3>
              <p className="text-muted-foreground mb-4">{error?.message || "Please try again"}</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 w-full max-w-full">
      <Card className="w-full">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 space-y-2 sm:space-y-0">
          <CardTitle className="text-lg md:text-xl">Gmail</CardTitle>
          <Badge variant="outline" className="text-sm w-fit">
            {unreadCount} unread
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
              <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {data?.messages?.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No emails found</p>
            </div>
          ) : (
            <div className="w-full overflow-hidden">
              {/* Desktop Table View */}
              <div className="hidden md:block rounded-md border">
                <div className="w-full overflow-x-auto">
                  <Table className="w-full table-fixed">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[20%] min-w-[140px]">Sender</TableHead>
                        <TableHead className="w-[50%] min-w-[200px]">Subject</TableHead>
                        <TableHead className="w-[20%] min-w-[100px]">Date</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.messages?.map(email => (
                        <TableRow
                          key={email.id}
                          className={`${email.isRead ? "" : "font-medium bg-muted/30"} hover:bg-muted/50`}
                        >
                          <TableCell className="truncate pr-2">
                            <div
                              className="truncate"
                              title={`${email.fromName || ""} <${email.from}>`}
                            >
                              {email.fromName || email.from}
                            </div>
                          </TableCell>
                          <TableCell className="pr-2">
                            <div className="space-y-1">
                              <div className="truncate">
                                <span className="mr-2" title={email.subject}>
                                  {email.subject}
                                </span>
                                {email.isImportant && (
                                  <Badge variant="secondary" className="text-xs">
                                    Important
                                  </Badge>
                                )}
                              </div>
                              <div
                                className="text-sm text-muted-foreground truncate"
                                title={email.snippet || email.preview}
                              >
                                {email.snippet || email.preview}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="truncate">
                            <div className="truncate" title={formatDate(email.receivedAt)}>
                              {formatDate(email.receivedAt)}
                            </div>
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
                                <DropdownMenuItem
                                  onClick={() => handleMessageAction("view", email)}
                                  className="cursor-pointer"
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleMessageAction("edit", email)}
                                  className="cursor-pointer"
                                >
                                  <Edit3 className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleMessageAction("delete", email)}
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
                {data?.messages?.map(email => (
                  <Card
                    key={email.id}
                    className={`${email.isRead ? "" : "border-l-4 border-l-blue-500"} hover:shadow-md transition-shadow`}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <p
                            className="font-medium truncate text-sm"
                            title={`${email.fromName || ""} <${email.from}>`}
                          >
                            {email.fromName || email.from}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(email.receivedAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-2 shrink-0">
                          {email.isImportant && (
                            <Badge variant="secondary" className="text-xs">
                              Important
                            </Badge>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 cursor-pointer"
                              >
                                <MoreHorizontal className="h-3 w-3" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleMessageAction("view", email)}
                                className="cursor-pointer"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleMessageAction("edit", email)}
                                className="cursor-pointer"
                              >
                                <Edit3 className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleMessageAction("delete", email)}
                                className="text-destructive focus:text-destructive cursor-pointer"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <h4
                        className={`text-sm mb-1 ${email.isRead ? "font-normal" : "font-semibold"}`}
                      >
                        {email.subject}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {email.snippet || email.preview}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {data?.pagination && (
            <UrlPagination
              total={data.pagination.total}
              totalPages={data.pagination.totalPages}
              className="mt-4"
              itemLabel="emails"
            />
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ViewMessageDialog
        open={viewDialog.open}
        onOpenChange={open => setViewDialog({ open, message: open ? viewDialog.message : null })}
        message={viewDialog.message}
        onEdit={handleEditMessage}
        onDelete={handleDeleteMessage}
      />

      {/* Edit Message Dialog */}
      <EditMessageDialog
        open={editDialog.open}
        onOpenChange={open => setEditDialog({ open, message: open ? editDialog.message : null })}
        message={editDialog.message}
        onSave={handleSaveMessage}
        loading={isUpdating}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={open =>
          setDeleteDialog({ open, message: open ? deleteDialog.message : null })
        }
        title="Delete Message"
        description={`Are you sure you want to delete the message "${deleteDialog.message?.subject || "(No Subject)"}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        destructive={true}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
      />
    </div>
  );
}
