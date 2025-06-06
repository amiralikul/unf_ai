import { useState, useMemo } from 'react';

/**
 * Custom hook for managing pagination state and logic
 * 
 * @param {Object} options - Configuration options
 * @param {number} options.initialPage - Initial page number (default: 1)
 * @param {number} options.initialLimit - Initial items per page (default: 10)
 * @param {number} options.total - Total number of items
 * @param {number} options.totalPages - Total number of pages (if known)
 * @returns {Object} Pagination state and functions
 */
export const usePagination = ({
  initialPage = 1,
  initialLimit = 10,
  total = 0,
  totalPages = null
} = {}) => {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  // Calculate total pages if not provided
  const calculatedTotalPages = useMemo(() => {
    if (totalPages !== null) return totalPages;
    return Math.ceil(total / limit);
  }, [total, limit, totalPages]);

  // Pagination metadata
  const pagination = useMemo(() => ({
    page,
    limit,
    total,
    totalPages: calculatedTotalPages,
    hasNextPage: page < calculatedTotalPages,
    hasPrevPage: page > 1,
    startItem: total > 0 ? (page - 1) * limit + 1 : 0,
    endItem: Math.min(page * limit, total),
    isFirstPage: page === 1,
    isLastPage: page >= calculatedTotalPages
  }), [page, limit, total, calculatedTotalPages]);

  // Navigation functions
  const goToPage = (newPage) => {
    const validPage = Math.max(1, Math.min(newPage, calculatedTotalPages));
    setPage(validPage);
    return validPage;
  };

  const nextPage = () => {
    if (pagination.hasNextPage) {
      return goToPage(page + 1);
    }
    return page;
  };

  const prevPage = () => {
    if (pagination.hasPrevPage) {
      return goToPage(page - 1);
    }
    return page;
  };

  const firstPage = () => goToPage(1);

  const lastPage = () => goToPage(calculatedTotalPages);

  const reset = (newPage = initialPage) => {
    setPage(newPage);
    setLimit(initialLimit);
  };

  // Generate page numbers for display (with ellipsis logic)
  const getPageNumbers = (maxVisible = 5) => {
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
      
      if (page <= halfVisible + 1) {
        // Near the beginning
        for (let i = 1; i <= totalVisible - 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(calculatedTotalPages);
      } else if (page >= calculatedTotalPages - halfVisible) {
        // Near the end
        pages.push(1);
        pages.push('ellipsis');
        for (let i = calculatedTotalPages - totalVisible + 2; i <= calculatedTotalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        pages.push(1);
        pages.push('ellipsis');
        for (let i = page - halfVisible + 1; i <= page + halfVisible - 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(calculatedTotalPages);
      }
    }
    
    return pages;
  };

  return {
    // State
    page,
    limit,
    setPage,
    setLimit,
    
    // Metadata
    pagination,
    
    // Navigation functions
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    reset,
    
    // Utility functions
    getPageNumbers,
    
    // For API integration
    getParams: () => ({ page, limit }),
    
    // For updating from API response
    updateFromResponse: (response) => {
      if (response?.pagination) {
        const { page: responsePage, limit: responseLimit, total: responseTotal, totalPages: responseTotalPages } = response.pagination;
        if (responsePage && responsePage !== page) setPage(responsePage);
        if (responseLimit && responseLimit !== limit) setLimit(responseLimit);
        // Note: total and totalPages are passed as props, not managed internally
      }
    }
  };
};

export default usePagination; 