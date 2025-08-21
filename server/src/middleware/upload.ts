import multer from 'multer';
import { Request } from 'express';
import { CustomError } from '../utils/errorHandler';
import { AuthenticatedRequest } from '../types';

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory for processing

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  try {
    // Check if file exists
    if (!file) {
      return cb(new CustomError('No file provided', 400));
    }

    // Check file size (multer will also check this, but we can do early validation)
    if (file.size && file.size > 10 * 1024 * 1024) { // 10MB limit
      return cb(new CustomError('File too large. Maximum size is 10MB', 400));
    }

    // Basic mime type validation
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/json',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new CustomError(`File type not allowed: ${file.mimetype}`, 400));
    }

    // File is valid
    cb(null, true);
  } catch (error: any) {
    cb(new CustomError(`File validation error: ${error.message}`, 400));
  }
};

// Create multer upload configurations
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1, // Allow only 1 file at a time
    fieldSize: 1 * 1024 * 1024, // 1MB field size limit
  }
});

// Specific configuration for avatar uploads (smaller size limit, images only)
export const avatarUpload = multer({
  storage,
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    try {
      // Check if file exists
      if (!file) {
        return cb(new CustomError('No file provided', 400));
      }

      // Check file size for avatars (5MB limit)
      if (file.size && file.size > 5 * 1024 * 1024) {
        return cb(new CustomError('Avatar file too large. Maximum size is 5MB', 400));
      }

      // Only allow image types for avatars
      const allowedImageTypes = [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/webp'
      ];

      if (!allowedImageTypes.includes(file.mimetype)) {
        return cb(new CustomError(`Invalid image type for avatar: ${file.mimetype}`, 400));
      }

      // File is valid
      cb(null, true);
    } catch (error: any) {
      cb(new CustomError(`Avatar validation error: ${error.message}`, 400));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for avatars
    files: 1, // Allow only 1 file at a time
    fieldSize: 500 * 1024, // 500KB field size limit
  }
});

// Middleware to handle multer errors
export const handleMulterError = (error: any, req: Request, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          error: 'File too large. Please select a smaller file.'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          error: 'Too many files. Please select only one file.'
        });
      case 'LIMIT_FIELD_COUNT':
        return res.status(400).json({
          success: false,
          error: 'Too many fields in the request.'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          error: 'Unexpected file field. Please check your form.'
        });
      default:
        return res.status(400).json({
          success: false,
          error: `Upload error: ${error.message}`
        });
    }
  }

  // If it's a custom error from our file filter
  if (error instanceof CustomError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message
    });
  }

  // Pass other errors to the global error handler
  next(error);
};

// Helper middleware to validate required file
export const requireFile = (fieldName: string = 'file') => {
  return (req: Request, res: any, next: any) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: `No file uploaded. Please select a file for the '${fieldName}' field.`
      });
    }
    next();
  };
};

// Helper middleware to log file upload details
export const logFileUpload = (req: AuthenticatedRequest, res: any, next: any) => {
  if (req.file) {
    console.log('📁 File upload details:', {
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      fieldname: req.file.fieldname,
      user: req.user?.id || 'anonymous'
    });
  }
  next();
};