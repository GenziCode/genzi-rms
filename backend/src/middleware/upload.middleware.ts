import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { BadRequestError } from '../utils/appError';
import { logger } from '../utils/logger';

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    // Generate unique filename: uuid-timestamp-original.ext
    const uniqueSuffix = `${uuidv4()}-${Date.now()}`;
    const ext = path.extname(file.originalname);
    const filename = `${uniqueSuffix}${ext}`;
    cb(null, filename);
  },
});

// File filter for validation
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allowed file types
  const allowedMimes = [
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    // Text
    'text/plain',
    'text/csv',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError(`File type not allowed: ${file.mimetype}`));
  }
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
    files: 10, // Max 10 files per request
  },
});

// Single file upload middleware
export const uploadSingle = (fieldName: string = 'file') => {
  return (req: any, res: any, next: any) => {
    const uploadHandler = upload.single(fieldName);
    
    uploadHandler(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new BadRequestError('File size exceeds limit (max 10MB)'));
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return next(new BadRequestError('Too many files'));
        }
        return next(new BadRequestError(`Upload error: ${err.message}`));
      } else if (err) {
        return next(err);
      }
      
      if (!req.file) {
        return next(new BadRequestError('No file uploaded'));
      }
      
      logger.info(`File uploaded: ${req.file.filename} (${req.file.size} bytes)`);
      next();
    });
  };
};

// Multiple files upload middleware
export const uploadMultiple = (fieldName: string = 'files', maxCount: number = 10) => {
  return (req: any, res: any, next: any) => {
    const uploadHandler = upload.array(fieldName, maxCount);
    
    uploadHandler(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new BadRequestError('File size exceeds limit (max 10MB per file)'));
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return next(new BadRequestError(`Too many files (max ${maxCount})`));
        }
        return next(new BadRequestError(`Upload error: ${err.message}`));
      } else if (err) {
        return next(err);
      }
      
      if (!req.files || (req.files as any[]).length === 0) {
        return next(new BadRequestError('No files uploaded'));
      }
      
      logger.info(`Files uploaded: ${(req.files as any[]).length} files`);
      next();
    });
  };
};

// Image-only upload middleware
export const uploadImage = (fieldName: string = 'image') => {
  const imageFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new BadRequestError('Only image files are allowed'));
    }
  };

  const imageUpload = multer({
    storage,
    fileFilter: imageFilter,
    limits: {
      fileSize: parseInt(process.env.MAX_IMAGE_SIZE || '5242880'), // 5MB default for images
      files: 10,
    },
  });

  return (req: any, res: any, next: any) => {
    const uploadHandler = imageUpload.single(fieldName);
    
    uploadHandler(req, res, (err: any) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new BadRequestError('Image size exceeds limit (max 5MB)'));
          }
          return next(new BadRequestError(`Upload error: ${err.message}`));
        }
        return next(err);
      }
      
      if (!req.file) {
        return next(new BadRequestError('No image uploaded'));
      }
      
      next();
    });
  };
};

// Multiple images upload middleware
export const uploadImages = (fieldName: string = 'images', maxCount: number = 10) => {
  const imageFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new BadRequestError('Only image files are allowed'));
    }
  };

  const imageUpload = multer({
    storage,
    fileFilter: imageFilter,
    limits: {
      fileSize: parseInt(process.env.MAX_IMAGE_SIZE || '5242880'), // 5MB default for images
      files: maxCount,
    },
  });

  return (req: any, res: any, next: any) => {
    const uploadHandler = imageUpload.array(fieldName, maxCount);
    
    uploadHandler(req, res, (err: any) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new BadRequestError('Image size exceeds limit (max 5MB per image)'));
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return next(new BadRequestError(`Too many images (max ${maxCount})`));
          }
          return next(new BadRequestError(`Upload error: ${err.message}`));
        }
        return next(err);
      }
      
      if (!req.files || (req.files as any[]).length === 0) {
        return next(new BadRequestError('No images uploaded'));
      }
      
      next();
    });
  };
};
