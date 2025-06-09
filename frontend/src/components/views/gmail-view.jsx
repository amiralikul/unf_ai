import React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, Archive, Trash2, AlertCircle } from "lucide-react"
import { useGmailMessages, useSyncGmailMessages } from "@/hooks/useGmailMessages"
import { usePagination } from "@/hooks/usePagination"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious,
  PaginationEllipsis
} from "@/components/ui/pagination"
import { format, isToday, isYesterday, parseISO } from "date-fns"

export default function GmailView() {
  
  // Initialize pagination hook with default values
  const paginationHook = usePagination({
    initialPage: 1,
    initialLimit: 10,
    total: 0,
    totalPages: null
  })
  
  // Fetch Gmail messages with React Query
  const { 
    data, 
    isLoading, 
    isError, 
    error 
  } = useGmailMessages({ 
    page: paginationHook.page, 
    limit: paginationHook.limit
  })
  
  // Update pagination hook when we have data
  const currentPagination = usePagination({
    initialPage: paginationHook.page,
    initialLimit: paginationHook.limit,
    total: data?.pagination?.total || 0,
    totalPages: data?.pagination?.totalPages || null
  })
  
  // Sync mutation
  const { 
    mutate: syncEmails, 
    isPending: isSyncing 
  } = useSyncGmailMessages()
  
  // Format date for display
  const formatDate = (dateString) => {
    try {
      const date = parseISO(dateString)
      if (isToday(date)) {
        return format(date, "h:mm a")
      } else if (isYesterday(date)) {
        return "Yesterday"
      } else {
        return format(date, "MMM d")
      }
    } catch (error) {
      return dateString
    }
  }
  
  // Handle refresh
  const handleRefresh = () => {
    syncEmails()
  }
  
  // Get unread count
  const unreadCount = data?.messages?.filter(email => !email.isRead).length || 0
  
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
              {Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
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
    )
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
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="outline" size="icon" className="shrink-0">
              <Archive className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="shrink-0">
              <Trash2 className="h-4 w-4" />
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
                        <TableHead className="w-[60%] min-w-[200px]">Subject</TableHead>
                        <TableHead className="w-[20%] min-w-[100px]">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.messages?.map((email) => (
                        <TableRow 
                          key={email.id} 
                          className={email.isRead ? "" : "font-medium bg-muted/30"}
                        >
                          <TableCell className="truncate pr-2">
                            <div className="truncate" title={`${email.fromName || ''} <${email.from}>`}>
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
                              <div className="text-sm text-muted-foreground truncate" title={email.snippet || email.preview}>
                                {email.snippet || email.preview}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="truncate">
                            <div className="truncate" title={formatDate(email.receivedAt)}>
                              {formatDate(email.receivedAt)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {data?.messages?.map((email) => (
                  <Card 
                    key={email.id} 
                    className={`${email.isRead ? "" : "border-l-4 border-l-blue-500"} cursor-pointer hover:shadow-md transition-shadow`}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-sm" title={`${email.fromName || ''} <${email.from}>`}>
                            {email.fromName || email.from}
                          </p>
                          <p className="text-xs text-muted-foreground">{formatDate(email.receivedAt)}</p>
                        </div>
                        {email.isImportant && (
                          <Badge variant="secondary" className="text-xs ml-2 shrink-0">
                            Important
                          </Badge>
                        )}
                      </div>
                      <h4 className={`text-sm mb-1 ${email.isRead ? "font-normal" : "font-semibold"}`}>
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
            <div className="mt-4 w-full">
              <div className="flex flex-col items-center space-y-2">
                <Pagination className="w-full">
                  <PaginationContent className="flex-wrap justify-center gap-1">
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          paginationHook.prevPage();
                        }}
                        className={currentPagination.pagination.isFirstPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    
                    {/* Generate page numbers using the hook */}
                    {currentPagination.getPageNumbers().map((pageNum, index) => {
                      if (pageNum === 'ellipsis') {
                        return (
                          <PaginationItem key={`ellipsis-${index}`} className="hidden sm:block">
                            <PaginationEllipsis />
                          </PaginationItem>
                        )
                      }
                      
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink 
                            href="#"
                            isActive={currentPagination.page === pageNum}
                            onClick={(e) => {
                              e.preventDefault();
                              paginationHook.goToPage(pageNum);
                            }}
                            className="cursor-pointer text-xs sm:text-sm"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    })}
                    
                    <PaginationItem>
                      <PaginationNext 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          paginationHook.nextPage();
                        }}
                        className={currentPagination.pagination.isLastPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
                
                {/* Pagination info */}
                <div className="text-xs sm:text-sm text-muted-foreground text-center">
                  Showing {currentPagination.pagination.startItem} to {currentPagination.pagination.endItem} of {currentPagination.pagination.total} emails
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
