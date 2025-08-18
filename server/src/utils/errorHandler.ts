import { Request, Response, NextFunction } from 'express';
import { AppError, ApiResponse } from '../types';

// Custom error class
export class CustomError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error response helper
export const sendErrorResponse = (
  res: Response,
  error: AppError | Error,
  statusCode: number = 500
): void => {
  const errorResponse: ApiResponse = {
    success: false,
    error: error.message || 'Internal Server Error',
  };

  res.status(statusCode).json(errorResponse);
};

// Success response helper
export const sendSuccessResponse = <T>(
  res: Response,
  data: T,
  message: string = 'Success',
  statusCode: number = 200
): void => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
  };

  res.status(statusCode).json(response);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Global error handler middleware
export const globalErrorHandler = (
  error: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', error);

  if (error instanceof CustomError) {
    sendErrorResponse(res, error, error.statusCode);
    return;
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    sendErrorResponse(res, new CustomError(error.message, 400));
    return;
  }

  // Handle duplicate key errors
  if (error.message.includes('duplicate key')) {
    sendErrorResponse(res, new CustomError('Resource already exists', 409));
    return;
  }

  // Default error
  sendErrorResponse(res, error, 500);
};

// Not found handler
export const notFoundHandler = (req: Request, res: Response): void => {
  sendErrorResponse(res, new CustomError('Route not found', 404));
};
