/**
 * Utility functions for handling pagination
 */

/**
 * Extract and normalize pagination parameters from query
 * @param {object} query - Express request query object
 * @param {number} defaultPage - Default page number (default: 1)
 * @param {number} defaultLimit - Default items per page (default: 10)
 * @returns {object} Normalized pagination parameters
 */
export const getPaginationParams = (query, defaultPage = 1, defaultLimit = 10) => {
  const page = parseInt(query.page) || defaultPage;
  const limit = parseInt(query.limit) || defaultLimit;

  return {
    page,
    limit,
    skip: (page - 1) * limit
  };
};

/**
 * Calculate pagination metadata
 * @param {number} total - Total number of items
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @returns {object} Pagination metadata
 */
export const getPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
};
