import React, { useState, useEffect } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select.jsx";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import { Alert, AlertDescription } from "@/components/ui/alert.jsx";
import { UrlPagination } from "@/components/ui/url-pagination.jsx";
import { useTrelloBoards, useSyncTrelloData } from "@/hooks/useTrelloBoards.js";
import {
  useTrelloCardsWithPagination,
  useSyncTrelloCards,
  useUpdateTrelloCard,
  useDeleteTrelloCard
} from "@/hooks/useTrelloCards.js";
import { useUrlPagination } from "@/hooks/useUrlPagination.js";
import { useAuth } from "@/hooks/useAuth.js";
import { TrelloCredentialsSetup } from "../components/TrelloCredentialsSetup.jsx";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import ViewTrelloCardDialog from "@/components/dialogs/ViewTrelloCardDialog.jsx";
import EditTrelloCardDialog from "@/components/dialogs/EditTrelloCardDialog.jsx";
import ConfirmDialog from "@/components/ui/confirm-dialog.jsx";

const getStatusBadge = (status, listName) => {
  // Use the actual list name if available, otherwise fall back to status
  const displayName = listName || status;

  // Use consistent blue styling for all status badges
  return (
    <Badge variant="default" className="bg-blue-500 text-white">
      {displayName}
    </Badge>
  );
};

const getPriorityBadge = priority => {
  switch (priority) {
    case "Low":
      return (
        <Badge variant="outline" className="border-blue-500 text-blue-500">
          Low
        </Badge>
      );
    case "Medium":
      return (
        <Badge variant="outline" className="border-amber-500 text-amber-500">
          Medium
        </Badge>
      );
    case "High":
      return (
        <Badge variant="outline" className="border-red-500 text-red-500">
          High
        </Badge>
      );
    default:
      return null;
  }
};

const formatDate = dateString => {
  if (!dateString) return "--";
  try {
    const date = parseISO(dateString);
    if (isToday(date)) {
      return format(date, "h:mm a");
    } else if (isYesterday(date)) {
      return "Yesterday";
    } else {
      return format(date, "MMM d, yyyy");
    }
  } catch (error) {
    return dateString;
  }
};

export default function TrelloPage() {
  const [selectedBoardId, setSelectedBoardId] = useState(null);
  const { user } = useAuth();

  // Use URL-based pagination
  const { pagination, reset: resetPagination } = useUrlPagination({ page: 1, limit: 10 });

  // Check if user has Trello credentials configured
  const hasTrelloCredentials = user?.hasTrelloCredentials;

  // Fetch boards to get available options
  const {
    data: boardsData,
    isLoading: isBoardsLoading,
    isError: isBoardsError,
    error: boardsError
  } = useTrelloBoards();

  // Fetch cards for selected board
  const {
    data: cardsData,
    isLoading: isCardsLoading,
    isError: isCardsError,
    error: cardsError
  } = useTrelloCardsWithPagination(selectedBoardId, {
    page: pagination.page,
    limit: pagination.limit
  });

  // Sync mutations
  const { mutate: syncBoards, isPending: isSyncingBoards } = useSyncTrelloData();
  const { mutate: syncCards, isPending: isSyncingCards } = useSyncTrelloCards();

  // CRUD mutations
  const { mutate: updateCard, isPending: isUpdating } = useUpdateTrelloCard();
  const { mutate: deleteCard, isPending: isDeleting } = useDeleteTrelloCard();

  // Dialog states
  const [viewDialog, setViewDialog] = useState({ open: false, card: null });
  const [editDialog, setEditDialog] = useState({ open: false, card: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, card: null });

  // Auto-select first board if none selected
  useEffect(() => {
    if (!selectedBoardId && boardsData?.boards?.[0]) {
      setSelectedBoardId(boardsData.boards[0].id);
      resetPagination(); // Reset to page 1 when auto-selecting first board
    }
  }, [boardsData, selectedBoardId, resetPagination]);

  // Handle refresh
  const handleRefresh = () => {
    if (selectedBoardId) {
      syncCards();
    } else {
      syncBoards();
    }
  };

  // Handle successful credentials setup
  const handleCredentialsSuccess = () => {
    // Credentials have been saved, the user data will be refreshed automatically
    // and hasTrelloCredentials will become true, hiding the setup component
  };

  // Handle card actions
  const handleViewCard = card => {
    setViewDialog({ open: true, card });
  };

  const handleEditCard = card => {
    setEditDialog({ open: true, card });
  };

  const handleDeleteCard = card => {
    setDeleteDialog({ open: true, card });
  };

  const handleCardAction = (action, card) => {
    switch (action) {
      case "view":
        handleViewCard(card);
        break;
      case "edit":
        handleEditCard(card);
        break;
      case "delete":
        handleDeleteCard(card);
        break;
      default:
        break;
    }
  };

  const handleSaveCard = cardData => {
    updateCard(
      {
        id: cardData.id,
        data: {
          name: cardData.name,
          description: cardData.description,
          priority: cardData.priority,
          dueDate: cardData.dueDate
        }
      },
      {
        onSuccess: () => {
          setEditDialog({ open: false, card: null });
        },
        onError: error => {
          console.error("Failed to update card:", error);
          // Keep dialog open on error so user can retry
        }
      }
    );
  };

  const handleConfirmDelete = () => {
    if (deleteDialog.card) {
      deleteCard(deleteDialog.card.id, {
        onSuccess: () => {
          setDeleteDialog({ open: false, card: null });
        },
        onError: error => {
          console.error("Failed to delete card:", error);
          // Keep dialog open on error so user can retry
        }
      });
    }
  };

  // Show credentials setup if user hasn't configured Trello API credentials
  if (!hasTrelloCredentials) {
    return (
      <div className="p-4 md:p-6 w-full max-w-full">
        <TrelloCredentialsSetup onSuccess={handleCredentialsSuccess} />
      </div>
    );
  }

  // Get cards and derived data
  const cards = cardsData?.cards || [];
  const lists = cardsData?.lists || [];
  const selectedBoard = boardsData?.boards?.find(board => board.id === selectedBoardId);

  // Create a map for quick list name lookup
  const listNameMap = {};
  lists.forEach(list => {
    listNameMap[list.status] = list.name;
  });

  // Loading state
  if (isBoardsLoading) {
    return <TrelloViewSkeleton />;
  }

  // Error state for boards - check if it's a credentials error
  if (isBoardsError) {
    if (boardsError?.code === "TRELLO_AUTH_REQUIRED") {
      return (
        <div className="p-4 md:p-6 w-full max-w-full">
          <TrelloCredentialsSetup onSuccess={handleCredentialsSuccess} />
        </div>
      );
    }
    return <TrelloErrorState message="Failed to load Trello boards" onRetry={handleRefresh} />;
  }

  // No boards available
  if (!boardsData?.boards?.length) {
    return <TrelloEmptyState onSync={() => syncBoards()} isSyncing={isSyncingBoards} />;
  }

  return (
    <div className="p-4 md:p-6 w-full max-w-full">
      <Card className="w-full">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 space-y-2 sm:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <CardTitle className="text-lg md:text-xl">Trello</CardTitle>
            {boardsData?.boards?.length > 0 && (
              <Select
                value={selectedBoardId}
                onValueChange={newBoardId => {
                  setSelectedBoardId(newBoardId);
                  resetPagination(); // Reset to page 1 when changing boards
                }}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Select Board" />
                </SelectTrigger>
                <SelectContent>
                  {boardsData.boards.map(board => (
                    <SelectItem key={board.id} value={board.id}>
                      {board.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {lists.map(list => {
              const count = cards.filter(card => card.status === list.status).length;

              return (
                <Badge key={list.id} variant="default" className="text-sm bg-blue-500 text-white">
                  {count} {list.name}
                </Badge>
              );
            })}
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pb-4">
            <div className="flex items-center gap-2 justify-end sm:justify-start flex-wrap ml-auto">
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isSyncingCards || isSyncingBoards}
                className="shrink-0"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isSyncingCards || isSyncingBoards ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>

          {/* Cards Error State */}
          {isCardsError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load cards: {cardsError?.message || "Unknown error"}
              </AlertDescription>
            </Alert>
          )}

          {/* Cards Loading State */}
          {isCardsLoading ? (
            <CardsLoadingSkeleton />
          ) : cards.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">
                {selectedBoard ? `No cards found in "${selectedBoard.name}"` : "No cards found"}
              </p>
              {selectedBoard && (
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  className="mt-4"
                  disabled={isSyncingCards}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isSyncingCards ? "animate-spin" : ""}`} />
                  Sync Cards from Trello
                </Button>
              )}
            </div>
          ) : (
            <div className="w-full overflow-hidden">
              {/* Desktop Table View */}
              <div className="hidden md:block rounded-md border">
                <div className="w-full overflow-x-auto">
                  <Table className="w-full table-fixed">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">ID</TableHead>
                        <TableHead className="w-[35%]">Card</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cards.map(card => (
                        <TableRow key={card.id}>
                          <TableCell className="font-mono text-xs">
                            {card.trelloId?.slice(-6) || card.id?.slice(-6) || "N/A"}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium truncate">{card.name}</div>
                            <div className="text-sm text-muted-foreground truncate">
                              {card.description || "No description"}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(card.status, listNameMap[card.status])}
                          </TableCell>
                          <TableCell>{getPriorityBadge(card.priority)}</TableCell>
                          <TableCell>{formatDate(card.dueDate)}</TableCell>
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
                                  onClick={() => handleCardAction("view", card)}
                                  className="cursor-pointer"
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleCardAction("edit", card)}
                                  className="cursor-pointer"
                                >
                                  <Edit3 className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleCardAction("delete", card)}
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
                {cards.map(card => (
                  <Card
                    key={card.id}
                    className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-sm">{card.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Due: {formatDate(card.dueDate)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-2 shrink-0">
                          {getStatusBadge(card.status, listNameMap[card.status])}
                          {getPriorityBadge(card.priority)}
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
                                onClick={() => handleCardAction("view", card)}
                                className="cursor-pointer"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleCardAction("edit", card)}
                                className="cursor-pointer"
                              >
                                <Edit3 className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleCardAction("delete", card)}
                                className="text-destructive focus:text-destructive cursor-pointer"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {card.description || "No description"}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {cardsData?.pagination && (
                <UrlPagination
                  total={cardsData.pagination.total}
                  totalPages={cardsData.pagination.totalPages}
                  className="mt-4"
                  itemLabel="cards"
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ViewTrelloCardDialog
        open={viewDialog.open}
        onOpenChange={open => setViewDialog({ open, card: open ? viewDialog.card : null })}
        card={viewDialog.card}
        onEdit={handleEditCard}
        onDelete={handleDeleteCard}
      />

      <EditTrelloCardDialog
        open={editDialog.open}
        onOpenChange={open => setEditDialog({ open, card: open ? editDialog.card : null })}
        card={editDialog.card}
        onSave={handleSaveCard}
        loading={isUpdating}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={open => setDeleteDialog({ open, card: open ? deleteDialog.card : null })}
        title="Delete Trello Card"
        description={`Are you sure you want to delete "${deleteDialog.card?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        variant="destructive"
      />
    </div>
  );
}

// Loading skeleton component
const TrelloViewSkeleton = () => (
  <div className="p-4 md:p-6 w-full max-w-full">
    <Card className="w-full">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 space-y-2 sm:space-y-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-14" />
          <Skeleton className="h-5 w-14" />
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

// Cards loading skeleton
const CardsLoadingSkeleton = () => (
  <div className="space-y-2">
    {[...Array(5)].map((_, i) => (
      <Skeleton key={i} className="h-16 w-full" />
    ))}
  </div>
);

// Error state component
const TrelloErrorState = ({ message, onRetry }) => (
  <div className="p-4 md:p-6 w-full max-w-full">
    <Card className="w-full">
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Trello Data</h3>
          <p className="text-muted-foreground mb-4">{message}</p>
          <Button onClick={onRetry}>Try Again</Button>
        </div>
      </CardContent>
    </Card>
  </div>
);

// Empty state component
const TrelloEmptyState = ({ onSync, isSyncing }) => (
  <div className="p-4 md:p-6 w-full max-w-full">
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Trello</CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <h3 className="text-lg font-semibold mb-2">No Trello Boards Found</h3>
          <p className="text-muted-foreground mb-4">Sync your Trello boards to get started</p>
          <Button onClick={onSync} disabled={isSyncing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
            Sync from Trello
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
);
