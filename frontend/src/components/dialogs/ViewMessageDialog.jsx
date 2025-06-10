import * as React from "react";
import { ExternalLink, Trash2, Edit, Mail, Paperclip, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, parseISO } from "date-fns";

const formatDate = dateString => {
  try {
    const date = parseISO(dateString);
    return format(date, "PPpp"); // Example: "Apr 29, 2023 at 3:00 PM"
  } catch (error) {
    return dateString;
  }
};

export function ViewMessageDialog({ open, onOpenChange, message, onEdit, onDelete }) {
  if (!message) return null;

  const handleDelete = () => {
    onDelete?.(message);
    onOpenChange(false);
  };

  const handleOpenInGmail = () => {
    // Gmail URL format: https://mail.google.com/mail/u/0/#inbox/messageId
    const gmailUrl = `https://mail.google.com/mail/u/0/#inbox/${message.id}`;
    window.open(gmailUrl, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {message.subject || "(No Subject)"}
          </DialogTitle>
          <DialogDescription>Email message details and metadata</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4">
            {/* Message Status Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {message.isUnread && <Badge variant="default">Unread</Badge>}
              {message.isImportant && <Badge variant="secondary">Important</Badge>}
              {message.attachments && message.attachments.length > 0 && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Paperclip className="h-3 w-3" />
                  {message.attachments.length} attachment
                  {message.attachments.length !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>

            <Separator />

            {/* Message Information */}
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-muted-foreground">From:</span>
                <div className="text-right">
                  <div>{message.senderName || message.sender}</div>
                  {message.senderName && message.senderEmail && (
                    <div className="text-xs text-muted-foreground">{message.senderEmail}</div>
                  )}
                </div>
              </div>

              <div className="flex justify-between">
                <span className="font-medium text-muted-foreground">To:</span>
                <div className="text-right">
                  <div>{message.recipientName || message.recipient}</div>
                  {message.recipientName && message.recipientEmail && (
                    <div className="text-xs text-muted-foreground">{message.recipientEmail}</div>
                  )}
                </div>
              </div>

              <div className="flex justify-between">
                <span className="font-medium text-muted-foreground">Date:</span>
                <span>{formatDate(message.receivedAt || message.date)}</span>
              </div>

              {message.threadId && (
                <div className="flex justify-between">
                  <span className="font-medium text-muted-foreground">Thread ID:</span>
                  <span className="font-mono text-xs">{message.threadId}</span>
                </div>
              )}

              {message.id && (
                <div className="flex justify-between">
                  <span className="font-medium text-muted-foreground">Message ID:</span>
                  <span className="font-mono text-xs">{message.id}</span>
                </div>
              )}
            </div>

            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Google Drive Links ({message.attachments.length})
                  </h4>
                  <div className="space-y-2">
                    {message.attachments.map((attachment, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 border rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {attachment.type}
                          </Badge>
                          <span className="text-sm font-mono">{attachment.fileId}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(attachment.url, "_blank")}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Open
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <Separator />

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onEdit?.(message)} className="flex-1">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>

          <Button variant="destructive" onClick={handleDelete} className="flex-1">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ViewMessageDialog;
