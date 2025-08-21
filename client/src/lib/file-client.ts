const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface FileUploadResult {
  file: {
    id: string;
    filename: string;
    original_name: string;
    mime_type: string;
    size: number;
    storage_path: string;
    public_url?: string;
    user_id: string;
    status: string;
    created_at: string;
    updated_at: string;
  };
  url: string;
  success: boolean;
}

export interface FileRecord {
  id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  storage_path: string;
  public_url?: string;
  user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface StorageStats {
  totalFiles: number;
  totalSize: number;
  formattedSize: string;
}

export class FileClient {
  private static async getAuthHeaders(): Promise<HeadersInit> {
    // Import supabase client inside the method to avoid circular dependencies
    const { createSupabaseClient } = await import('@/lib/supabase');
    const supabase = createSupabaseClient();
    
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    return {
      'Authorization': `Bearer ${token || ''}` 
    };
  }

  // Upload avatar image
  static async uploadAvatar(file: File, onProgress?: (progress: number) => void): Promise<FileUploadResult> {
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/files/upload-avatar`, {
        method: 'POST',
        headers: {
          ...(await this.getAuthHeaders())
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      return data.data;
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      throw new Error(error.message || 'Failed to upload avatar');
    }
  }

  // Get current user avatar
  static async getCurrentAvatar(): Promise<FileRecord | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/files/my-avatar`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(await this.getAuthHeaders())
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch avatar');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch avatar');
      }

      return data.data;
    } catch (error: any) {
      console.error('Get avatar error:', error);
      // Return null for avatar queries instead of throwing
      return null;
    }
  }

  // Get user files
  static async getUserFiles(type?: 'avatars' | 'documents'): Promise<FileRecord[]> {
    try {
      const queryParams = type ? `?type=${type}` : '';
      const response = await fetch(`${API_BASE_URL}/api/files/my-files${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(await this.getAuthHeaders())
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch files');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch files');
      }

      return data.data.files;
    } catch (error: any) {
      console.error('Get files error:', error);
      throw new Error(error.message || 'Failed to fetch files');
    }
  }

  // Delete file
  static async deleteFile(fileId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(await this.getAuthHeaders())
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete file');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete file');
      }

      return data.data.deleted;
    } catch (error: any) {
      console.error('Delete file error:', error);
      throw new Error(error.message || 'Failed to delete file');
    }
  }

  // Get storage statistics
  static async getStorageStats(): Promise<StorageStats> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/files/stats/storage`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(await this.getAuthHeaders())
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch storage stats');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch storage stats');
      }

      return data.data;
    } catch (error: any) {
      console.error('Get storage stats error:', error);
      throw new Error(error.message || 'Failed to fetch storage statistics');
    }
  }

  // Validate file before upload
  static validateImageFile(file: File): string | null {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      return 'Please select a valid image file (JPEG, PNG, or WebP)';
    }

    if (file.size > maxSize) {
      return 'File size must be less than 5MB';
    }

    return null; // No validation errors
  }

  // Create image preview URL
  static createImagePreview(file: File): string {
    return URL.createObjectURL(file);
  }

  // Clean up preview URL
  static revokeImagePreview(url: string): void {
    URL.revokeObjectURL(url);
  }

  // Format file size for display
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}