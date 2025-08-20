import { Request, Response } from "express";
import { UserModel } from "../models/User";
import { SubscriptionModel } from "../models/Subscription";
import {
  sendSuccessResponse,
  sendErrorResponse,
  asyncHandler,
} from "../utils/errorHandler";
import { User, AuthenticatedRequest } from "../types";

// Get all users
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const users = await UserModel.findAll();
  sendSuccessResponse(res, users, "Users retrieved successfully");
});

// Get user by ID
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await UserModel.findById(id);
  if (!user) {
    sendErrorResponse(res, new Error("User not found"), 404);
    return;
  }

  sendSuccessResponse(res, user, "User retrieved successfully");
});

// Create new user
export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, name } = req.body;

  // Basic validation
  if (!email) {
    sendErrorResponse(res, new Error("Email is required"), 400);
    return;
  }

  // Check if user already exists
  const existingUser = await UserModel.findByEmail(email);
  if (existingUser) {
    sendErrorResponse(
      res,
      new Error("User with this email already exists"),
      409
    );
    return;
  }

  const userData: Partial<User> = {
    email,
    name,
  };

  const newUser = await UserModel.create(userData);
  sendSuccessResponse(res, newUser, "User created successfully", 201);
});

// Update user
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { email, name } = req.body;

  const userData: Partial<User> = {};
  if (email) userData.email = email;
  if (name) userData.name = name;

  const updatedUser = await UserModel.update(id, userData);
  if (!updatedUser) {
    sendErrorResponse(res, new Error("User not found"), 404);
    return;
  }

  sendSuccessResponse(res, updatedUser, "User updated successfully");
});

// Delete user
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const deleted = await UserModel.delete(id);
  if (!deleted) {
    sendErrorResponse(res, new Error("User not found"), 404);
    return;
  }

  sendSuccessResponse(res, null, "User deleted successfully");
});

// Get user subscription
export const getUserSubscription = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  const subscription = await SubscriptionModel.findByUserId(userId);
  if (!subscription) {
    sendErrorResponse(res, new Error("No subscription found"), 404);
    return;
  }

  sendSuccessResponse(res, subscription, "Subscription retrieved successfully");
});
