import { useUrlPagination } from "@/hooks/useUrlPagination";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis
} from "@/components/ui/pagination";
import { useMemo } from "react";

/**
 * Reusable URL-based pagination component with ellipsis logic
 * Automatically manages pagination state through URL parameters
 *
 * @param {Object} props - Component props
 * @param {number} props.total - Total number of items
 * @param {number} props.totalPages - Total number of pages
 * @param {string} props.className - Additional CSS classes
 * @param {number} props.maxVisible - Maximum visible page numbers (default: 5)
 * @param {Object} props.defaults - Default pagination values
 * @param {boolean} props.showInfo - Whether to show pagination info text (default: true)
 * @param {string} props.itemLabel - Label for items (default: "items")
 * @returns {JSX.Element} Pagination component
 */
export const UrlPagination = ({
  total = 0,
  totalPages = null,
  className = "",
  maxVisible = 5,
  defaults = { page: 1, limit: 10 },
  showInfo = true,
  itemLabel = "items"
}) => {
  const { pagination, goToPage, nextPage, prevPage } = useUrlPagination(defaults);

  // Calculate total pages if not provided
  const calculatedTotalPages = useMemo(() => {
    if (totalPages !== null) return totalPages;
    return Math.ceil(total / pagination.limit);
  }, [total, pagination.limit, totalPages]);

  // Calculate pagination metadata
  const paginationMeta = useMemo(
    () => ({
      hasNextPage: pagination.page < calculatedTotalPages,
      hasPrevPage: pagination.page > 1,
      startItem: total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0,
      endItem: Math.min(pagination.page * pagination.limit, total),
      isFirstPage: pagination.page === 1,
      isLastPage: pagination.page >= calculatedTotalPages
    }),
    [pagination.page, pagination.limit, total, calculatedTotalPages]
  );

  // Generate page numbers with ellipsis logic
  const getPageNumbers = () => {
    const pages = [];
    const totalVisible = Math.min(maxVisible, calculatedTotalPages);

    if (calculatedTotalPages <= maxVisible) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= calculatedTotalPages; i++) {
        pages.push(i);
      }
    } else {
      // Complex logic for showing pages with ellipsis
      const halfVisible = Math.floor(totalVisible / 2);

      if (pagination.page <= halfVisible + 1) {
        // Near the beginning
        for (let i = 1; i <= totalVisible - 1; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(calculatedTotalPages);
      } else if (pagination.page >= calculatedTotalPages - halfVisible) {
        // Near the end
        pages.push(1);
        pages.push("ellipsis");
        for (let i = calculatedTotalPages - totalVisible + 2; i <= calculatedTotalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        pages.push(1);
        pages.push("ellipsis");
        for (
          let i = pagination.page - halfVisible + 1;
          i <= pagination.page + halfVisible - 1;
          i++
        ) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(calculatedTotalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  // Don't render if there are no pages or only one page
  if (calculatedTotalPages <= 1) {
    return showInfo && total > 0 ? (
      <div className="text-xs sm:text-sm text-muted-foreground text-center">
        Showing {total} {itemLabel}
      </div>
    ) : null;
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="flex flex-col items-center space-y-2">
        <Pagination className="w-full">
          <PaginationContent className="flex-wrap justify-center gap-1">
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={e => {
                  e.preventDefault();
                  if (paginationMeta.hasPrevPage) {
                    prevPage();
                  }
                }}
                className={
                  paginationMeta.isFirstPage ? "pointer-events-none opacity-50" : "cursor-pointer"
                }
              />
            </PaginationItem>

            {pageNumbers.map((pageNum, index) => {
              if (pageNum === "ellipsis") {
                return (
                  <PaginationItem key={`ellipsis-${index}`} className="hidden sm:block">
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }

              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    href="#"
                    isActive={pagination.page === pageNum}
                    onClick={e => {
                      e.preventDefault();
                      goToPage(pageNum);
                    }}
                    className="cursor-pointer text-xs sm:text-sm"
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={e => {
                  e.preventDefault();
                  if (paginationMeta.hasNextPage) {
                    nextPage();
                  }
                }}
                className={
                  paginationMeta.isLastPage ? "pointer-events-none opacity-50" : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>

        {/* Pagination info */}
        {showInfo && (
          <div className="text-xs sm:text-sm text-muted-foreground text-center">
            Showing {paginationMeta.startItem} to {paginationMeta.endItem} of {total} {itemLabel}
          </div>
        )}
      </div>
    </div>
  );
};
