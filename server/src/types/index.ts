import { Request, Response, NextFunction } from "express";

// Custom Request interface with user
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Error types
export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Database types
export interface User {
  id: string;
  email: string;
  name?: string;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Middleware types
export type AsyncHandler = (
  req: Request | AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => Promise<void>;

// Service types
export interface DatabaseService {
  getUsers(): Promise<User[]>;
  getUserById(id: string): Promise<User | null>;
  createUser(userData: Partial<User>): Promise<User>;
  updateUser(id: string, userData: Partial<User>): Promise<User | null>;
  deleteUser(id: string): Promise<boolean>;
}
