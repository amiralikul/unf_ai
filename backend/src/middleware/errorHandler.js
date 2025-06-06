import { formatErrorResponse, getStatusCode, isAppError } from '../utils/errors.js';

// Enhanced error logging
const logError = (error, req) => {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.userId,
    sessionId: req.cookies?.sessionId?.substring(0, 10) + '...' || 'none',
    error: {
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      stack: error.stack
    }
  };

  // Log different levels based on error type
  if (isAppError(error) && error.statusCode < 500) {
    // Client errors (4xx) - log as warning
    console.warn('Client Error:', JSON.stringify(errorInfo, null, 2));
  } else {
    // Server errors (5xx) - log as error
    console.error('Server Error:', JSON.stringify(errorInfo, null, 2));
  }
};

// Main error handling middleware
export const errorHandler = (error, req, res, next) => {
  // Log the error
  logError(error, req);

  // Get status code and format response
  const statusCode = getStatusCode(error);
  const errorResponse = formatErrorResponse(error);

  // Add request ID for tracking (if you implement request IDs)
  if (req.requestId) {
    errorResponse.requestId = req.requestId;
  }

  // Don't expose stack traces in production
  if (process.env.NODE_ENV === 'production') {
    delete errorResponse.stack;
    
    // Don't expose internal error details in production
    if (statusCode >= 500 && !isAppError(error)) {
      errorResponse.error = 'Internal server error';
      errorResponse.code = 'INTERNAL_ERROR';
      delete errorResponse.details;
    }
  } else {
    // Include stack trace in development
    errorResponse.stack = error.stack;
  }

  res.status(statusCode).json(errorResponse);
};

// Async error wrapper - catches async errors and passes them to error handler
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler for unmatched routes
export const notFoundHandler = (req, res, next) => {
  const error = {
    success: false,
    error: `Route ${req.method} ${req.url} not found`,
    code: 'ROUTE_NOT_FOUND',
    timestamp: new Date().toISOString()
  };
  
  res.status(404).json(error);
};

// Request ID middleware (optional but useful for tracking)
export const requestIdMiddleware = (req, res, next) => {
  req.requestId = Math.random().toString(36).substring(2, 15);
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

// Request logging middleware
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  console.log(`📥 ${req.method} ${req.url} - ${req.ip} - ${req.get('User-Agent')}`);
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? '🔴' : '🟢';
    console.log(`📤 ${statusColor} ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};
