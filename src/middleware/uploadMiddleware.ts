import { Context, Next } from 'hono';
import multer from 'multer';

// In-memory storage for multer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Accept images, videos, and documents
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'video/mp4', 'video/mov', 'video/avi', 'video/mkv', 'video/webm',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Middleware to handle single file upload
export const uploadSingle = (fieldName: string) => {
  return async (c: Context, next: Next) => {
    try {
      // @ts-ignore - multer types compatibility
      await new Promise((resolve, reject) => {
        const multerMiddleware = upload.single(fieldName);
        multerMiddleware(c.req.raw as any, c.req.raw as any, (err: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(true);
          }
        });
      });

      return await next();
    } catch (error: any) {
      return c.json({ error: error.message || 'File upload failed' }, 400);
    }
  };
};

// Middleware to handle multiple file uploads
export const uploadMultiple = (fieldName: string, maxCount: number = 10) => {
  return async (c: Context, next: Next) => {
    try {
      // @ts-ignore - multer types compatibility
      await new Promise((resolve, reject) => {
        const multerMiddleware = upload.array(fieldName, maxCount);
        multerMiddleware(c.req.raw as any, c.req.raw as any, (err: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(true);
          }
        });
      });

      return await next();
    } catch (error: any) {
      return c.json({ error: error.message || 'File upload failed' }, 400);
    }
  };
};

// Helper to get file from request
export const getUploadedFile = (c: Context) => {
  const req = c.req.raw as any;
  return req.file;
};

// Helper to get multiple files from request
export const getUploadedFiles = (c: Context) => {
  const req = c.req.raw as any;
  return req.files || [];
};

// Determine folder based on category
export const getFolderForCategory = (category: string): string => {
  const folders: Record<string, string> = {
    homepage: 'homepage',
    project: 'projects',
    crop: 'crops',
    testimonial: 'testimonials',
    profile: 'profiles',
    service: 'services',
    gallery: 'gallery',
    receipt: 'receipts',
    tip: 'tips',
  };

  return folders[category] || 'general';
};

// Determine resource type from MIME type
export const getResourceType = (mimeType: string): 'image' | 'video' | 'raw' | 'auto' => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('application/') || mimeType.startsWith('text/')) return 'raw';
  return 'auto';
};