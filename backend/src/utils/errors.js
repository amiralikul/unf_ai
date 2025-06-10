// Custom error classes for better error handling

export class AppError extends Error {
  constructor(message, statusCode = 500, code = "INTERNAL_ERROR", details = null) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication required", code = "AUTH_REQUIRED") {
    super(message, 401, code);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "Insufficient permissions", code = "INSUFFICIENT_PERMISSIONS") {
    super(message, 403, code);
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", resource = null) {
    super(message, 404, "NOT_FOUND", { resource });
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource conflict", details = null) {
    super(message, 409, "CONFLICT", details);
    this.name = "ConflictError";
  }
}

export class ExternalServiceError extends AppError {
  constructor(service, message, originalError = null) {
    super(`${service} service error: ${message}`, 502, "EXTERNAL_SERVICE_ERROR", {
      service,
      originalError: originalError?.message || originalError
    });
    this.name = "ExternalServiceError";
    this.service = service;
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Rate limit exceeded", retryAfter = null) {
    super(message, 429, "RATE_LIMIT_EXCEEDED", { retryAfter });
    this.name = "RateLimitError";
  }
}

export class DatabaseError extends AppError {
  constructor(message, operation = null, originalError = null) {
    super(`Database error: ${message}`, 500, "DATABASE_ERROR", {
      operation,
      originalError: originalError?.message || originalError
    });
    this.name = "DatabaseError";
  }
}

// Error type checking utilities
export const isAppError = error => error instanceof AppError;
export const isValidationError = error => error instanceof ValidationError;
export const isAuthError = error =>
  error instanceof AuthenticationError || error instanceof AuthorizationError;
export const isNotFoundError = error => error instanceof NotFoundError;
export const isExternalServiceError = error => error instanceof ExternalServiceError;

// Error formatting utilities
export const formatErrorResponse = error => {
  if (isAppError(error)) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      details: error.details
    };
  }

  // Handle Zod validation errors
  if (error.name === "ZodError") {
    return {
      success: false,
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      details: error.errors.map(err => ({
        field: err.path.join("."),
        message: err.message,
        code: err.code
      }))
    };
  }

  // Handle Prisma errors
  if (error.code && error.code.startsWith("P")) {
    return {
      success: false,
      error: "Database operation failed",
      code: "DATABASE_ERROR",
      details: { prismaCode: error.code }
    };
  }

  // Generic error
  return {
    success: false,
    error: "Internal server error",
    code: "INTERNAL_ERROR"
  };
};

// HTTP status code mapping
export const getStatusCode = error => {
  if (isAppError(error)) {
    return error.statusCode;
  }

  if (error.name === "ZodError") {
    return 400;
  }

  if (error.code && error.code.startsWith("P")) {
    // Prisma errors
    if (error.code === "P2002") return 409; // Unique constraint violation
    if (error.code === "P2025") return 404; // Record not found
    return 500;
  }

  return 500;
};
