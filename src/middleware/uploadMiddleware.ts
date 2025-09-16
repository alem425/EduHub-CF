import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

// Configure multer for memory storage (we'll upload to blob storage)
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allowed MIME types
  const allowedMimeTypes = [
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    // Archives
    'application/zip',
    'application/x-rar-compressed',
    // Code files
    'text/javascript',
    'text/typescript',
    'text/html',
    'text/css',
    'application/json'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type '${file.mimetype}' is not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`));
  }
};

// Create multer instance with configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 5 // Maximum 5 files per request
  },
  fileFilter: fileFilter
});

// Middleware for single file upload
export const uploadSingle = (fieldName: string = 'file') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const singleUpload = upload.single(fieldName);
    
    singleUpload(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size is 10MB.',
            error: 'FILE_TOO_LARGE'
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            message: 'Too many files. Maximum is 5 files.',
            error: 'TOO_MANY_FILES'
          });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            message: `Unexpected field. Expected field name: ${fieldName}`,
            error: 'UNEXPECTED_FIELD'
          });
        }
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`,
          error: 'UPLOAD_ERROR'
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
          error: 'INVALID_FILE_TYPE'
        });
      }
      next();
    });
  };
};

// Middleware for multiple file upload
export const uploadMultiple = (fieldName: string = 'files', maxCount: number = 5) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const multipleUpload = upload.array(fieldName, maxCount);
    
    multipleUpload(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'One or more files are too large. Maximum size is 10MB per file.',
            error: 'FILE_TOO_LARGE'
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            message: `Too many files. Maximum is ${maxCount} files.`,
            error: 'TOO_MANY_FILES'
          });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            message: `Unexpected field. Expected field name: ${fieldName}`,
            error: 'UNEXPECTED_FIELD'
          });
        }
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`,
          error: 'UPLOAD_ERROR'
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
          error: 'INVALID_FILE_TYPE'
        });
      }
      next();
    });
  };
};

// Middleware for mixed uploads (files + other form data)
export const uploadMixed = (fields: { name: string; maxCount?: number }[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const mixedUpload = upload.fields(fields);
    
    mixedUpload(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'One or more files are too large. Maximum size is 10MB per file.',
            error: 'FILE_TOO_LARGE'
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            message: 'Too many files for one or more fields.',
            error: 'TOO_MANY_FILES'
          });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            message: 'Unexpected field in upload.',
            error: 'UNEXPECTED_FIELD'
          });
        }
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`,
          error: 'UPLOAD_ERROR'
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
          error: 'INVALID_FILE_TYPE'
        });
      }
      next();
    });
  };
};

// Helper function to check if files were uploaded
export const hasFiles = (req: Request): boolean => {
  return !!(req.file || (req.files && (req.files as Express.Multer.File[]).length > 0));
};

// Helper function to get uploaded files as array
export const getUploadedFiles = (req: Request): Express.Multer.File[] => {
  if (req.file) {
    return [req.file];
  }
  if (req.files && Array.isArray(req.files)) {
    return req.files;
  }
  if (req.files && typeof req.files === 'object') {
    // Handle fields upload
    const files: Express.Multer.File[] = [];
    Object.values(req.files).forEach((fieldFiles) => {
      if (Array.isArray(fieldFiles)) {
        files.push(...fieldFiles);
      }
    });
    return files;
  }
  return [];
};

// Validation helper
export const validateFileRequirements = (
  req: Request,
  submissionFormat: 'text' | 'file' | 'both'
): { isValid: boolean; error?: string } => {
  const hasText = req.body.submissionText && req.body.submissionText.trim().length > 0;
  const hasFileUploads = hasFiles(req);

  switch (submissionFormat) {
    case 'text':
      if (!hasText) {
        return {
          isValid: false,
          error: 'Text submission is required for this assignment.'
        };
      }
      break;
    
    case 'file':
      if (!hasFileUploads) {
        return {
          isValid: false,
          error: 'File submission is required for this assignment.'
        };
      }
      break;
    
    case 'both':
      if (!hasText && !hasFileUploads) {
        return {
          isValid: false,
          error: 'Either text or file submission is required for this assignment.'
        };
      }
      break;
  }

  return { isValid: true };
};
