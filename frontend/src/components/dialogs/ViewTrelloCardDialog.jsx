import * as React from "react";
import { ExternalLink, Edit, Trash2, Calendar, Flag, BarChart3 } from "lucide-react";
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
import { format, parseISO } from "date-fns";

const getPriorityColor = priority => {
  switch (priority) {
    case "High":
      return "border-red-500 text-red-500";
    case "Medium":
      return "border-amber-500 text-amber-500";
    case "Low":
      return "border-blue-500 text-blue-500";
    default:
      return "border-gray-500 text-gray-500";
  }
};

const formatDate = dateString => {
  try {
    const date = parseISO(dateString);
    return format(date, "PPpp"); // Example: "Apr 29, 2023 at 3:00 PM"
  } catch (error) {
    return dateString;
  }
};

export function ViewTrelloCardDialog({ open, onOpenChange, card, onEdit, onDelete }) {
  if (!card) return null;

  const handleEdit = () => {
    onEdit?.(card);
    onOpenChange(false);
  };

  const handleDelete = () => {
    onDelete?.(card);
    onOpenChange(false);
  };

  const handleOpenInTrello = () => {
    if (card.url) {
      window.open(card.url, "_blank");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            {card.name}
          </DialogTitle>
          <DialogDescription>Trello card details and metadata</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status and Priority Badges */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            <Badge variant="default" className="bg-blue-500 text-white">
              {card.status}
            </Badge>
            {card.priority && (
              <>
                <span className="text-sm font-medium ml-4">Priority:</span>
                <Badge variant="outline" className={getPriorityColor(card.priority)}>
                  <Flag className="mr-1 h-3 w-3" />
                  {card.priority}
                </Badge>
              </>
            )}
          </div>

          <Separator />

          {/* Card Information */}
          <div className="grid grid-cols-1 gap-3 text-sm">
            {card.description && (
              <div>
                <span className="font-medium text-muted-foreground">Description:</span>
                <div className="mt-1 p-3 bg-muted rounded-md">
                  <p className="whitespace-pre-wrap">{card.description}</p>
                </div>
              </div>
            )}

            {card.dueDate && (
              <div className="flex justify-between">
                <span className="font-medium text-muted-foreground">Due Date:</span>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(card.dueDate)}</span>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <span className="font-medium text-muted-foreground">Created:</span>
              <span>{formatDate(card.createdAt)}</span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium text-muted-foreground">Updated:</span>
              <span>{formatDate(card.updatedAt)}</span>
            </div>

            {card.trelloId && (
              <div className="flex justify-between">
                <span className="font-medium text-muted-foreground">Trello ID:</span>
                <span className="font-mono text-xs">{card.trelloId}</span>
              </div>
            )}

            {card.boardId && (
              <div className="flex justify-between">
                <span className="font-medium text-muted-foreground">Board ID:</span>
                <span className="font-mono text-xs">{card.boardId}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleEdit} className="flex-1">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>

            {card.url && (
              <Button variant="outline" onClick={handleOpenInTrello} className="flex-1">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in Trello
              </Button>
            )}

            <Button variant="destructive" onClick={handleDelete} className="flex-1">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ViewTrelloCardDialog;
