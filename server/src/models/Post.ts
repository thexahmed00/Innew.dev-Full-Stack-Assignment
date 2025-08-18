import { supabase, TABLES } from '../config/supabase';
import { Post } from '../types';
import { CustomError } from '../utils/errorHandler';

export class PostModel {
  // Get all posts
  static async findAll(): Promise<Post[]> {
    const { data, error } = await supabase
      .from(TABLES.POSTS)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new CustomError(`Failed to fetch posts: ${error.message}`, 500);
    }

    return data || [];
  }

  // Get post by ID
  static async findById(id: string): Promise<Post | null> {
    const { data, error } = await supabase
      .from(TABLES.POSTS)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Post not found
      }
      throw new CustomError(`Failed to fetch post: ${error.message}`, 500);
    }

    return data;
  }

  // Get posts by user ID
  static async findByUserId(userId: string): Promise<Post[]> {
    const { data, error } = await supabase
      .from(TABLES.POSTS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new CustomError(`Failed to fetch user posts: ${error.message}`, 500);
    }

    return data || [];
  }

  // Create new post
  static async create(postData: Partial<Post>): Promise<Post> {
    const { data, error } = await supabase
      .from(TABLES.POSTS)
      .insert([postData])
      .select()
      .single();

    if (error) {
      throw new CustomError(`Failed to create post: ${error.message}`, 500);
    }

    return data;
  }

  // Update post
  static async update(id: string, postData: Partial<Post>): Promise<Post | null> {
    const { data, error } = await supabase
      .from(TABLES.POSTS)
      .update(postData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Post not found
      }
      throw new CustomError(`Failed to update post: ${error.message}`, 500);
    }

    return data;
  }

  // Delete post
  static async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from(TABLES.POSTS)
      .delete()
      .eq('id', id);

    if (error) {
      throw new CustomError(`Failed to delete post: ${error.message}`, 500);
    }

    return true;
  }
}
