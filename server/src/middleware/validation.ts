import { Request, Response, NextFunction } from 'express';
import { sendErrorResponse } from '../utils/errorHandler';

// Basic email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate user creation
export const validateCreateUser = (req: Request, res: Response, next: NextFunction): void => {
  const { email, name } = req.body;

  if (!email) {
    sendErrorResponse(res, new Error('Email is required'), 400);
    return;
  }

  if (!validateEmail(email)) {
    sendErrorResponse(res, new Error('Invalid email format'), 400);
    return;
  }

  if (name && typeof name !== 'string') {
    sendErrorResponse(res, new Error('Name must be a string'), 400);
    return;
  }

  next();
};

// Validate post creation
export const validateCreatePost = (req: Request, res: Response, next: NextFunction): void => {
  const { title, content, user_id } = req.body;

  if (!title || typeof title !== 'string') {
    sendErrorResponse(res, new Error('Title is required and must be a string'), 400);
    return;
  }

  if (!content || typeof content !== 'string') {
    sendErrorResponse(res, new Error('Content is required and must be a string'), 400);
    return;
  }

  if (!user_id || typeof user_id !== 'string') {
    sendErrorResponse(res, new Error('User ID is required and must be a string'), 400);
    return;
  }

  if (title.trim().length < 1) {
    sendErrorResponse(res, new Error('Title cannot be empty'), 400);
    return;
  }

  if (content.trim().length < 1) {
    sendErrorResponse(res, new Error('Content cannot be empty'), 400);
    return;
  }

  next();
};

// Validate UUID format
export const validateUUID = (req: Request, res: Response, next: NextFunction): void => {
  const { id } = req.params;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(id)) {
    sendErrorResponse(res, new Error('Invalid ID format'), 400);
    return;
  }

  next();
};

// Rate limiting middleware (basic implementation)
export const rateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  // This is a basic implementation
  // In production, you'd want to use a proper rate limiting library like express-rate-limit
  const clientIP = req.ip || req.connection.remoteAddress;
  
  // For now, just pass through
  // You can implement actual rate limiting logic here
  next();
};
