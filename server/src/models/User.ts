import { supabase, TABLES } from '../config/supabase';
import { User } from '../types';
import { CustomError } from '../utils/errorHandler';

export class UserModel {
  // Get all users
  static async findAll(): Promise<User[]> {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new CustomError(`Failed to fetch users: ${error.message}`, 500);
    }

    return data || [];
  }

  // Get user by ID
  static async findById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // User not found
      }
      throw new CustomError(`Failed to fetch user: ${error.message}`, 500);
    }

    return data;
  }

  // Get user by email
  static async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // User not found
      }
      throw new CustomError(`Failed to fetch user: ${error.message}`, 500);
    }

    return data;
  }

  // Create new user
  static async create(userData: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .insert([userData])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new CustomError('User with this email already exists', 409);
      }
      throw new CustomError(`Failed to create user: ${error.message}`, 500);
    }

    return data;
  }

  // Update user
  static async update(id: string, userData: Partial<User>): Promise<User | null> {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .update(userData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // User not found
      }
      throw new CustomError(`Failed to update user: ${error.message}`, 500);
    }

    return data;
  }

  // Delete user
  static async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from(TABLES.USERS)
      .delete()
      .eq('id', id);

    if (error) {
      throw new CustomError(`Failed to delete user: ${error.message}`, 500);
    }

    return true;
  }
}
