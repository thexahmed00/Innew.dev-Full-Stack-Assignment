import express, { Response } from 'express';
import { FileService } from '../services/fileService';
import { authenticateUser } from '../middleware/auth';
import { avatarUpload, upload, handleMulterError, requireFile, logFileUpload } from '../middleware/upload';
import { AuthenticatedRequest } from '../types';
import { CustomError } from '../utils/errorHandler';

const router = express.Router();

// Upload avatar endpoint
router.post('/upload-avatar', 
  authenticateUser,
  avatarUpload.single('avatar'),
  handleMulterError,
  requireFile('avatar'),
  logFileUpload,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const file = req.file!;

      console.log(`🖼️ Processing avatar upload for user ${userId}`);

      const result = await FileService.uploadAvatar(
        userId,
        file.buffer,
        file.originalname,
        file.mimetype
      );

      res.json({
        success: true,
        message: 'Avatar uploaded successfully',
        data: result
      });

    } catch (error: any) {
      console.error('Avatar upload error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Avatar upload failed'
      });
    }
  }
);

// Upload general file endpoint
router.post('/upload',
  authenticateUser,
  upload.single('file'),
  handleMulterError,
  requireFile('file'),
  logFileUpload,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const file = req.file!;

      console.log(`📎 Processing file upload for user ${userId}`);

      // For now, we'll treat all non-avatar files as documents
      // You can extend this logic based on file type or additional parameters
      
      res.status(501).json({
        success: false,
        error: 'General file upload not implemented yet. Use /upload-avatar for profile pictures.'
      });

    } catch (error: any) {
      console.error('File upload error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'File upload failed'
      });
    }
  }
);

// Get user's files
router.get('/my-files', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { type } = req.query;
    
    // Validate file type filter
    const fileType = type && ['avatars', 'documents'].includes(type as string) 
      ? (type as 'avatars' | 'documents') 
      : undefined;

    const files = await FileService.getUserFiles(userId, fileType);

    res.json({
      success: true,
      data: {
        files,
        count: files.length,
        filter: fileType || 'all'
      }
    });

  } catch (error: any) {
    console.error('Get files error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to fetch files'
    });
  }
});

// Get user's current avatar
router.get('/my-avatar', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const avatar = await FileService.getUserAvatar(userId);

    if (!avatar) {
      return res.json({
        success: true,
        data: null,
        message: 'No avatar found'
      });
    }

    return res.json({
      success: true,
      data: avatar
    });

  } catch (error: any) {
    console.error('Get avatar error:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to fetch avatar'
    });
  }
});

// Delete a file
router.delete('/:fileId', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { fileId } = req.params;

    if (!fileId) {
      throw new CustomError('File ID is required', 400);
    }

    console.log(`🗑️ Deleting file ${fileId} for user ${userId}`);

    const success = await FileService.deleteFile(userId, fileId);

    res.json({
      success: true,
      message: 'File deleted successfully',
      data: { deleted: success }
    });

  } catch (error: any) {
    console.error('Delete file error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to delete file'
    });
  }
});

// Get file details by ID
router.get('/:fileId', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { fileId } = req.params;

    if (!fileId) {
      throw new CustomError('File ID is required', 400);
    }

    const file = await FileService.getUserFiles(userId);
    const requestedFile = file.find(f => f.id === fileId);

    if (!requestedFile) {
      return res.status(404).json({
        success: false,
        error: 'File not found or you do not have access to this file'
      });
    }

    return res.json({
      success: true,
      data: requestedFile
    });

  } catch (error: any) {
    console.error('Get file error:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to fetch file'
    });
  }
});

// Get user storage statistics
router.get('/stats/storage', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const stats = await FileService.getUserStorageStats(userId);

    res.json({
      success: true,
      data: stats
    });

  } catch (error: any) {
    console.error('Get storage stats error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to fetch storage statistics'
    });
  }
});

export default router;