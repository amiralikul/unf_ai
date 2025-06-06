/**
 * Utility functions for standardized API responses
 */

/**
 * Send a successful response with standardized format
 * @param {object} res - Express response object
 * @param {object} data - Response data
 * @param {object} meta - Optional metadata (pagination, etc.)
 */
export const sendSuccess = (res, data, meta = {}) => {
  res.json({
    success: true,
    data,
    meta
  });
};

/**
 * Send an error response with standardized format
 * @param {object} res - Express response object
 * @param {Error} error - Error object
 * @param {number} status - HTTP status code
 */
export const sendError = (res, error, status = 500) => {
  res.status(status).json({
    success: false,
    error: error.message,
    code: error.code,
    details: error.details
  });
};
