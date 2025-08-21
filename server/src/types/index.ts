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
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PAST_DUE' | 'CANCELED' | 'UNPAID';
  plan_name?: string;
  price_id?: string;
  current_period_start?: string;
  current_period_end?: string;
  credits_total?: number | null;
  credits_used?: number;
  credits_reset_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  slug?: string;
  published: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface File {
  id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  storage_path: string;
  public_url?: string;
  user_id: string;
  status: 'ACTIVE' | 'DELETED' | 'QUARANTINED';
  created_at: string;
  updated_at: string;
}

// File creation input type
export interface FileCreateInput {
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  storage_path: string;
  public_url?: string;
  user_id: string;
  status?: 'ACTIVE' | 'DELETED' | 'QUARANTINED';
}

// File update input type
export interface FileUpdateInput {
  filename?: string;
  original_name?: string;
  mime_type?: string;
  size?: number;
  storage_path?: string;
  public_url?: string;
  status?: 'ACTIVE' | 'DELETED' | 'QUARANTINED';
}

// File upload result type
export interface FileUploadResult {
  file: File;
  url: string;
  success: boolean;
}

export interface WebhookEvent {
  id: string;
  stripe_event_id: string;
  event_type: string;
  processed: boolean;
  data: any;
  created_at: string;
}

// Stripe types
export interface StripeProduct {
  id: string;
  name: string;
  description?: string;
  prices: StripePrice[];
}

export interface StripePrice {
  id: string;
  product: string;
  unit_amount: number;
  currency: string;
  recurring?: {
    interval: 'day' | 'week' | 'month' | 'year';
    interval_count: number;
  };
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
