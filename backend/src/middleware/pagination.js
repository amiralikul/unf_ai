/**
 * Middleware for handling pagination in API requests
 */

/**
 * Extract pagination parameters from request query and attach to request object
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
export const paginationMiddleware = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  req.pagination = {
    page,
    limit,
    skip: (page - 1) * limit
  };

  next();
};

export default paginationMiddleware;
