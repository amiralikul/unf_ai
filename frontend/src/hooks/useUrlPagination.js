import { useSearchParams } from 'react-router-dom';
import { useMemo } from 'react';

/**
 * Custom hook for URL-based pagination that synchronizes pagination state with URL parameters
 * This provides a single source of truth for pagination and enables shareable URLs with state
 * 
 * @param {Object} defaults - Default pagination values
 * @param {number} defaults.page - Default page number (default: 1)
 * @param {number} defaults.limit - Default items per page (default: 10)
 * @returns {Object} Pagination state and navigation functions
 */
export const useUrlPagination = (defaults = { page: 1, limit: 10 }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Parse pagination parameters from URL
  const pagination = useMemo(() => {
    const page = parseInt(searchParams.get('page')) || defaults.page;
    const limit = parseInt(searchParams.get('limit')) || defaults.limit;
    
    // Ensure values are valid
    return {
      page: Math.max(1, page),
      limit: Math.max(1, Math.min(100, limit)) // Cap limit at 100 for performance
    };
  }, [searchParams, defaults]);
  
  /**
   * Update pagination parameters in URL
   * @param {Object} newParams - New pagination parameters
   * @param {number} newParams.page - New page number
   * @param {number} newParams.limit - New items per page
   * @param {boolean} options.replace - Whether to replace current history entry (default: false)
   */
  const updatePagination = (newParams, options = { replace: false }) => {
    setSearchParams(prev => {
      const updated = new URLSearchParams(prev);
      
      Object.entries(newParams).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          // Only set if different from default to keep URLs clean
          if (key === 'page' && value === defaults.page) {
            updated.delete(key);
          } else if (key === 'limit' && value === defaults.limit) {
            updated.delete(key);
          } else {
            updated.set(key, value.toString());
          }
        } else {
          updated.delete(key);
        }
      });
      
      return updated;
    }, { replace: options.replace });
  };
  
  // Navigation functions that update URL parameters
  const goToPage = (newPage, options = {}) => {
    const validPage = Math.max(1, newPage);
    updatePagination({ page: validPage }, options);
    return validPage;
  };
  
  const nextPage = (options = {}) => {
    return goToPage(pagination.page + 1, options);
  };
  
  const prevPage = (options = {}) => {
    return goToPage(pagination.page - 1, options);
  };
  
  const firstPage = (options = {}) => {
    return goToPage(1, options);
  };
  
  const lastPage = (totalPages, options = {}) => {
    if (totalPages && totalPages > 0) {
      return goToPage(totalPages, options);
    }
    return pagination.page;
  };
  
  const setLimit = (newLimit, options = {}) => {
    const validLimit = Math.max(1, Math.min(100, newLimit));
    // Reset to page 1 when changing limit to avoid being on an invalid page
    updatePagination({ page: 1, limit: validLimit }, options);
  };
  
  const reset = (resetDefaults = defaults, options = { replace: true }) => {
    updatePagination(resetDefaults, options);
  };
  
  return {
    // Current pagination state
    pagination,
    
    // Navigation functions
    updatePagination,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    setLimit,
    reset,
    
    // Helper to get params for API calls
    getParams: () => pagination
  };
}; 