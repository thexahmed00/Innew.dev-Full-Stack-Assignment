
import { supabase, TABLES } from '../config/supabase';
import { File, FileCreateInput, FileUpdateInput } from '../types';
import { CustomError } from '../utils/errorHandler';

export class FileModel {
  // Create a new file record
  static async create(fileData: FileCreateInput): Promise<File> {
    try {
      const { data, error } = await supabase
        .from(TABLES.FILES)
        .insert([{
          ...fileData,
          status: fileData.status || 'ACTIVE'
        }])
        .select()
        .single();

      if (error) {
        throw new CustomError(`Failed to create file record: ${error.message}`, 500);
      }

      return data;
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(`Failed to create file: ${error.message}`, 500);
    }
  }

  // Find file by ID
  static async findById(id: string): Promise<File | null> {
    try {
      const { data, error } = await supabase
        .from(TABLES.FILES)
        .select('*')
        .eq('id', id)
        .eq('status', 'ACTIVE')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // File not found
        }
        throw new CustomError(`Failed to fetch file: ${error.message}`, 500);
      }

      return data;
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(`Failed to find file: ${error.message}`, 500);
    }
  }

  // Find all files for a specific user
  static async findByUserId(userId: string, limit: number = 50): Promise<File[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.FILES)
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new CustomError(`Failed to fetch user files: ${error.message}`, 500);
      }

      return data || [];
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(`Failed to find user files: ${error.message}`, 500);
    }
  }

  // Find user's current avatar file
  static async findUserAvatar(userId: string): Promise<File | null> {
    try {
      const { data, error } = await supabase
        .from(TABLES.FILES)
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'ACTIVE')
        .like('storage_path', `%/avatars/%`)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No avatar found
        }
        throw new CustomError(`Failed to fetch user avatar: ${error.message}`, 500);
      }

      return data;
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      return null; // Return null if no avatar found instead of throwing
    }
  }

  // Update file record
  static async update(id: string, updateData: FileUpdateInput): Promise<File | null> {
    try {
      const { data, error } = await supabase
        .from(TABLES.FILES)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // File not found
        }
        throw new CustomError(`Failed to update file: ${error.message}`, 500);
      }

      return data;
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(`Failed to update file: ${error.message}`, 500);
    }
  }

  // Soft delete file (mark as DELETED)
  static async softDelete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(TABLES.FILES)
        .update({ status: 'DELETED' })
        .eq('id', id);

      if (error) {
        throw new CustomError(`Failed to delete file: ${error.message}`, 500);
      }

      return true;
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(`Failed to delete file: ${error.message}`, 500);
    }
  }

  // Hard delete file record (permanent removal)
  static async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(TABLES.FILES)
        .delete()
        .eq('id', id);

      if (error) {
        throw new CustomError(`Failed to permanently delete file: ${error.message}`, 500);
      }

      return true;
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(`Failed to delete file record: ${error.message}`, 500);
    }
  }

  // Find files by type (based on storage path)
  static async findByType(userId: string, fileType: 'avatars' | 'documents'): Promise<File[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.FILES)
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'ACTIVE')
        .like('storage_path', `%/${fileType}/%`)
        .order('created_at', { ascending: false });

      if (error) {
        throw new CustomError(`Failed to fetch ${fileType} files: ${error.message}`, 500);
      }

      return data || [];
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(`Failed to find ${fileType} files: ${error.message}`, 500);
    }
  }

  // Get file storage statistics for a user
  static async getUserStorageStats(userId: string): Promise<{ totalFiles: number; totalSize: number }> {
    try {
      const { data, error } = await supabase
        .from(TABLES.FILES)
        .select('size')
        .eq('user_id', userId)
        .eq('status', 'ACTIVE');

      if (error) {
        throw new CustomError(`Failed to fetch storage stats: ${error.message}`, 500);
      }

      const totalFiles = data?.length || 0;
      const totalSize = data?.reduce((acc, file) => acc + file.size, 0) || 0;

      return { totalFiles, totalSize };
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(`Failed to calculate storage stats: ${error.message}`, 500);
    }
  }

  // Clean up old avatar files for a user (keep only the latest)
  static async cleanupOldAvatars(userId: string, keepLatest: number = 1): Promise<void> {
    try {
      // Get all avatar files for user
      const avatarFiles = await this.findByType(userId, 'avatars');
      
      if (avatarFiles.length <= keepLatest) {
        return; // Nothing to clean up
      }

      // Sort by creation date (newest first) and get files to delete
      const filesToDelete = avatarFiles.slice(keepLatest);

      // Mark old files as deleted
      for (const file of filesToDelete) {
        await this.softDelete(file.id);
      }

      console.log(`✅ Cleaned up ${filesToDelete.length} old avatar files for user ${userId}`);
    } catch (error: any) {
      console.error(`❌ Failed to cleanup old avatars for user ${userId}:`, error);
      // Don't throw error here as this is a cleanup operation
    }
  }
}