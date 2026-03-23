import { Request, Response, NextFunction } from 'express';

/**
 * Global error handler middleware.
 * Catches all unhandled errors from route handlers.
 * NEVER sends internal error details (stack trace, error.message) to client.
 */
export const globalErrorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Always log the full error internally
  console.error('❌ Unhandled Error:', err);

  // Default error response
  let statusCode = err.statusCode || 500;
  let errorCode = 'SERVER_ERROR';
  let message = 'An unexpected error occurred. Please try again.';

  // MongoDB Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    const fields = Object.keys(err.errors || {}).join(', ');
    message = fields
      ? `Validation failed for: ${fields}`
      : 'Validation failed. Please check your input.';
  }

  // MongoDB CastError (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    statusCode = 400;
    errorCode = 'INVALID_ID';
    message = 'Invalid ID format.';
  }

  // MongoDB Duplicate Key (code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    errorCode = 'DUPLICATE_ENTRY';
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    message = `A record with this ${field} already exists.`;
  }

  // Firebase Auth errors
  if (err.code && typeof err.code === 'string' && err.code.startsWith('auth/')) {
    statusCode = 401;
    errorCode = 'AUTH_ERROR';
    message = 'Authentication failed. Please try again.';
  }

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    errorCode = 'FILE_TOO_LARGE';
    message = 'File is too large. Maximum size is 10MB.';
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
    },
  });
};
