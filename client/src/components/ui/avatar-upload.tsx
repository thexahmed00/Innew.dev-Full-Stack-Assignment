"use client";

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileClient, FileUploadResult } from '@/lib/file-client';
import { Upload, Camera, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  onAvatarUpdate?: (result: FileUploadResult) => void;
  onAvatarDelete?: () => void;
  userName?: string;
  className?: string;
}

export function AvatarUpload({
  currentAvatarUrl,
  onAvatarUpdate,
  onAvatarDelete,
  userName = 'User',
  className = ''
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    // Validate file
    const validationError = FileClient.validateImageFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    // Create preview
    const preview = FileClient.createImagePreview(file);
    setPreviewUrl(preview);

    // Upload file
    setIsUploading(true);
    try {
      const result = await FileClient.uploadAvatar(file);
      
      // Clean up preview URL
      FileClient.revokeImagePreview(preview);
      setPreviewUrl(null);

      // Call callback with result
      onAvatarUpdate?.(result);
      toast.success('Profile picture updated successfully!');

    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast.error(error.message || 'Failed to upload profile picture');
      
      // Clean up preview URL on error
      FileClient.revokeImagePreview(preview);
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  }, [onAvatarUpdate]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input value
    event.target.value = '';
  }, [handleFileSelect]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
  }, []);

  const handleDeleteAvatar = useCallback(() => {
    // For now, we just call the callback
    // In a full implementation, you might want to call the delete API
    onAvatarDelete?.();
    toast.success('Profile picture removed');
  }, [onAvatarDelete]);

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const displayAvatarUrl = previewUrl || currentAvatarUrl;

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* Avatar Display */}
      <div
        className={`relative group cursor-pointer ${dragActive ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        <Avatar className="w-32 h-32 border-4 border-gray-200 group-hover:border-gray-300 transition-colors">
          <AvatarImage 
            src={displayAvatarUrl} 
            alt={`${userName}'s profile picture`}
            className="object-cover"
            onError={(e) => {
              console.error('❌ Avatar image failed to load:', displayAvatarUrl);
              e.currentTarget.style.display = 'none';
            }}
          />
          <AvatarFallback className="text-2xl font-semibold bg-gray-100">
            {getInitials(userName)}
          </AvatarFallback>
        </Avatar>

        {/* Upload Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
          {isUploading ? (
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          ) : (
            <Camera className="w-8 h-8 text-white" />
          )}
        </div>

        {/* Loading overlay */}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
            <div className="text-white text-xs">Uploading...</div>
          </div>
        )}
      </div>

      {/* Upload Instructions */}
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-2">
          Click to upload or drag and drop
        </p>
        <p className="text-xs text-gray-500">
          PNG, JPG or WebP (max 5MB)
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={openFileDialog}
          disabled={isUploading}
        >
          <Upload className="w-4 h-4 mr-2" />
          {isUploading ? 'Uploading...' : 'Choose File'}
        </Button>

        {(currentAvatarUrl || previewUrl) && !isUploading && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteAvatar}
            className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Remove
          </Button>
        )}
      </div>

      {/* Hidden File Input */}
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Drag and Drop Zone (invisible overlay) */}
      {dragActive && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-20 rounded-lg border-2 border-dashed border-blue-500 flex items-center justify-center">
          <div className="text-blue-600 font-medium">Drop your image here</div>
        </div>
      )}
    </div>
  );
}