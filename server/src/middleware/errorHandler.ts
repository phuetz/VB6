/**
 * Error Handler Middleware
 * Centralized error handling for the server
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = err as AppError;

  // Log error
  logger.error({
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    statusCode: error.statusCode || 500,
  });

  // Default error values
  if (!error.statusCode) {
    error = new AppError(error.message || 'Internal Server Error', 500);
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    error = new AppError('Validation Error', 400);
  } else if (err.name === 'CastError') {
    error = new AppError('Invalid ID format', 400);
  } else if (err.name === 'UnauthorizedError') {
    error = new AppError('Unauthorized', 401);
  } else if (err.name === 'SequelizeValidationError') {
    error = new AppError('Database Validation Error', 400);
  } else if (err.name === 'SequelizeDatabaseError') {
    error = new AppError('Database Error', 500);
  }

  // Send error response
  res.status(error.statusCode).json({
    success: false,
    error: {
      message: error.message,
      statusCode: error.statusCode,
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        details: err,
      }),
    },
    timestamp: new Date().toISOString(),
    path: req.url,
  });
};

// Async error handler wrapper
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void> | void
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Not found handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`Not Found - ${req.originalUrl}`, 404);
  next(error);
};

// Unhandled rejection handler
export const unhandledRejectionHandler = () => {
  process.on('unhandledRejection', (reason: Error | any, promise: Promise<any>) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);

    // Exit process in production
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });
};

// Uncaught exception handler
export const uncaughtExceptionHandler = () => {
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', error);

    // Exit process
    process.exit(1);
  });
};
