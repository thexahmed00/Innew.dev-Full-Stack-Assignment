import sharp from 'sharp';
import { FileModel } from '../models/File';
import { UserModel } from '../models/User';
import { uploadFileToS3, deleteFileFromS3 } from '../utils/S3Client';
import { CustomError } from '../utils/errorHandler';
import { File, FileCreateInput, FileUploadResult } from '../types';

export class FileService {
  private static readonly BUCKET_NAME = 'files';
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  private static readonly AVATAR_SIZE = { width: 400, height: 400 };

  // Upload and process avatar image
  static async uploadAvatar(
    userId: string,
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string
  ): Promise<FileUploadResult> {
    try {
      // Validate file
      this.validateImageFile(fileBuffer, mimeType, originalName);

      // Clean up old avatars first
      await FileModel.cleanupOldAvatars(userId, 0); // Delete all old avatars

      // Process image
      const processedBuffer = await this.processAvatarImage(fileBuffer);
      
      // Generate file info
      const timestamp = Date.now();
      const fileExtension = 'webp'; // Always convert to webp for consistency
      const filename = `avatar_${timestamp}.${fileExtension}`;
      const storagePath = `${userId}/avatars/${filename}`;
      
      // Upload to S3
      console.log(`📤 Uploading avatar to S3: ${storagePath}`);
      await uploadFileToS3(this.BUCKET_NAME, storagePath, processedBuffer, 'image/webp');

      // Create file record in database
      const fileData: FileCreateInput = {
        filename,
        original_name: originalName,
        mime_type: 'image/webp',
        size: processedBuffer.length,
        storage_path: storagePath,
        public_url: this.getPublicUrl(storagePath),
        user_id: userId,
        status: 'ACTIVE'
      };

      const file = await FileModel.create(fileData);

      // Update user's avatar URL
      await UserModel.update(userId, {
        avatar_url: fileData.public_url
      });

      console.log(`✅ Avatar uploaded successfully for user ${userId}: ${file.id}`);

      return {
        file,
        url: fileData.public_url!,
        success: true
      };

    } catch (error: any) {
      console.error(`❌ Avatar upload failed for user ${userId}:`, error);
      if (error instanceof CustomError) throw error;
      throw new CustomError(`Avatar upload failed: ${error.message}`, 500);
    }
  }

  // Delete file
  static async deleteFile(userId: string, fileId: string): Promise<boolean> {
    try {
      // Find the file
      const file = await FileModel.findById(fileId);
      if (!file) {
        throw new CustomError('File not found', 404);
      }

      // Check ownership
      if (file.user_id !== userId) {
        throw new CustomError('Access denied: You can only delete your own files', 403);
      }

      // Delete from S3
      try {
        await deleteFileFromS3(this.BUCKET_NAME, file.storage_path);
        console.log(`🗑️ File deleted from S3: ${file.storage_path}`);
      } catch (s3Error) {
        console.warn(`⚠️ Could not delete file from S3: ${file.storage_path}`, s3Error);
        // Continue with database deletion even if S3 deletion fails
      }

      // Delete from database (soft delete)
      await FileModel.softDelete(fileId);

      // If this was an avatar, clear the user's avatar URL
      if (file.storage_path.includes('/avatars/')) {
        await UserModel.update(userId, { avatar_url: undefined });
      }

      console.log(`✅ File deleted successfully: ${fileId}`);
      return true;

    } catch (error: any) {
      console.error(`❌ File deletion failed: ${fileId}`, error);
      if (error instanceof CustomError) throw error;
      throw new CustomError(`File deletion failed: ${error.message}`, 500);
    }
  }

  // Get user's files
  static async getUserFiles(userId: string, fileType?: 'avatars' | 'documents'): Promise<File[]> {
    try {
      if (fileType) {
        return await FileModel.findByType(userId, fileType);
      } else {
        return await FileModel.findByUserId(userId);
      }
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(`Failed to fetch user files: ${error.message}`, 500);
    }
  }

  // Get user's current avatar
  static async getUserAvatar(userId: string): Promise<File | null> {
    try {
      return await FileModel.findUserAvatar(userId);
    } catch (error: any) {
      console.error(`Error fetching user avatar for ${userId}:`, error);
      return null; // Return null instead of throwing for avatar queries
    }
  }

  // Process avatar image (resize, optimize, convert to webp)
  private static async processAvatarImage(buffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .resize(this.AVATAR_SIZE.width, this.AVATAR_SIZE.height, {
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: 90 })
        .toBuffer();
    } catch (error: any) {
      throw new CustomError(`Image processing failed: ${error.message}`, 400);
    }
  }

  // Validate image file for avatars
  private static validateImageFile(buffer: Buffer, mimeType: string, filename: string): void {
    // Check file size
    if (buffer.length > this.MAX_FILE_SIZE) {
      throw new CustomError(
        `File too large. Maximum size is ${Math.round(this.MAX_FILE_SIZE / 1024 / 1024)}MB`,
        400
      );
    }

    // Check MIME type
    if (!this.ALLOWED_IMAGE_TYPES.includes(mimeType)) {
      throw new CustomError(
        `Invalid file type. Allowed types: ${this.ALLOWED_IMAGE_TYPES.join(', ')}`,
        400
      );
    }

    // Check filename
    if (!filename || filename.trim().length === 0) {
      throw new CustomError('Invalid filename', 400);
    }
  }

  // Sanitize filename for storage
  private static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
      .substring(0, 100); // Limit length
  }

  // Get file extension from filename
  private static getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'bin';
  }

  // Generate public URL for file (simplified for Supabase Storage)
  private static getPublicUrl(storagePath: string): string {
    // Supabase Storage public URL format
    const supabaseUrl = process.env.SUPABASE_URL;
    const bucketName = this.BUCKET_NAME;
    return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${storagePath}`;
  }

  // Get user storage statistics
  static async getUserStorageStats(userId: string): Promise<{ totalFiles: number; totalSize: number; formattedSize: string }> {
    try {
      const stats = await FileModel.getUserStorageStats(userId);
      
      return {
        ...stats,
        formattedSize: this.formatFileSize(stats.totalSize)
      };
    } catch (error: any) {
      if (error instanceof CustomError) throw error;
      throw new CustomError(`Failed to get storage stats: ${error.message}`, 500);
    }
  }

  // Format file size in human readable format
  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}