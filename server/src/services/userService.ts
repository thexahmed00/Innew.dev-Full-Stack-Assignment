import { UserModel } from "../models/User";
import { User } from "../types";
import { CustomError } from "../utils/errorHandler";

export class UserService {
  // Get all users with optional filtering
  static async getAllUsers(limit?: number, offset?: number): Promise<User[]> {
    const users = await UserModel.findAll();

    // Apply pagination if provided
    if (limit || offset) {
      const start = offset || 0;
      const end = limit ? start + limit : undefined;
      return users.slice(start, end);
    }

    return users;
  }

  // Get user by ID with validation
  static async getUserById(id: string): Promise<User> {
    const user = await UserModel.findById(id);

    if (!user) {
      throw new CustomError("User not found", 404);
    }

    return user;
  }

  // Create user with business logic
  static async createUser(userData: Partial<User>): Promise<User> {
    // Check if user already exists
    if (userData.email) {
      const existingUser = await UserModel.findByEmail(userData.email);
      if (existingUser) {
        throw new CustomError("User with this email already exists", 409);
      }
    }

    // Additional business logic can be added here
    // For example, sending welcome email, creating user profile, etc.

    return await UserModel.create(userData);
  }

  // Update user with validation
  static async updateUser(id: string, userData: Partial<User>): Promise<User> {
    // Check if user exists
    const existingUser = await UserModel.findById(id);
    if (!existingUser) {
      throw new CustomError("User not found", 404);
    }

    // Check if email is being updated and if it's already taken
    if (userData.email && userData.email !== existingUser.email) {
      const userWithEmail = await UserModel.findByEmail(userData.email);
      if (userWithEmail) {
        throw new CustomError("Email is already taken", 409);
      }
    }

    const updatedUser = await UserModel.update(id, userData);
    if (!updatedUser) {
      throw new CustomError("Failed to update user", 500);
    }

    return updatedUser;
  }

  // Delete user with cleanup
  static async deleteUser(id: string): Promise<boolean> {
    // Check if user exists
    const existingUser = await UserModel.findById(id);
    if (!existingUser) {
      throw new CustomError("User not found", 404);
    }

    // Additional cleanup logic can be added here
    // For example, deleting user posts, comments, etc.

    return await UserModel.delete(id);
  }

  // Search users by name or email
  static async searchUsers(query: string): Promise<User[]> {
    const users = await UserModel.findAll();

    return users.filter(
      (user) =>
        user.name?.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase())
    );
  }
}
