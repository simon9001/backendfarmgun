import { Context, Next } from 'hono';

// Helper to determine folder based on category
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

// Helper to determine resource type from MIME type
export const getResourceType = (mimeType: string): 'image' | 'video' | 'raw' | 'auto' => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('application/') || mimeType.startsWith('text/')) return 'raw';
  return 'auto';
};

// Middleware to handle single file upload
export const uploadSingle = (fieldName: string) => {
  return async (c: Context, next: Next) => {
    try {
      const contentType = c.req.header('content-type') || '';
      if (!contentType.includes('multipart/form-data') && !contentType.includes('application/x-www-form-urlencoded')) {
        return await next();
      }

      const body = await c.req.parseBody({ all: true });
      const file = body[fieldName];

      console.log(`[Upload] Single upload request for field: ${fieldName}`);

      if (!file) {
        console.log(`[Upload] No file found in field: ${fieldName}`);
        // Store empty body in context even if no file
        c.set('parsedBody', body);
        return await next();
      }

      // Robust check for file-like object (File/Blob)
      const isFileLike = file instanceof Object && 'arrayBuffer' in file && 'type' in file;

      if (!isFileLike) {
        console.warn(`[Upload] Field ${fieldName} exists but is not a file/blob`);
        c.set('parsedBody', body);
        return await next();
      }

      const fileObj = file as any;
      console.log(`[Upload] Processing file: ${fileObj.name}, type: ${fileObj.type}, size: ${fileObj.size}`);

      // Accept images, videos, and documents
      const allowedMimes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm',
        'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
      ];

      if (!allowedMimes.includes(fileObj.type)) {
        console.warn(`[Upload] Rejected: Invalid MIME type ${fileObj.type}`);
        return c.json({ error: 'Invalid file type: ' + fileObj.type }, 400);
      }

      if (fileObj.size > 10 * 1024 * 1024) {
        console.warn(`[Upload] Rejected: File too large ${fileObj.size}`);
        return c.json({ error: 'File too large (max 10MB)' }, 400);
      }

      const buffer = Buffer.from(await fileObj.arrayBuffer());

      // Store in context instead of modifying c.req.raw
      c.set('file', {
        buffer,
        mimetype: fileObj.type,
        originalname: fileObj.name || 'file',
        size: fileObj.size
      });
      c.set('parsedBody', body);

      return await next();
    } catch (error: any) {
      console.error('[Upload] Middleware error:', error);
      return c.json({ error: error.message || 'File upload failed' }, 400);
    }
  };
};

// Middleware to handle multiple file uploads
export const uploadMultiple = (fieldName: string, maxCount: number = 10) => {
  return async (c: Context, next: Next) => {
    try {
      const contentType = c.req.header('content-type') || '';
      if (!contentType.includes('multipart/form-data') && !contentType.includes('application/x-www-form-urlencoded')) {
        return await next();
      }

      const body = await c.req.parseBody({ all: true });
      let files = body[fieldName];

      if (!files) {
        c.set('parsedBody', body);
        return await next();
      }

      if (!Array.isArray(files)) {
        files = [files];
      }

      console.log(`[Upload] Multiple upload request for field: ${fieldName}, count: ${files.length}`);

      if (files.length > maxCount) {
        return c.json({ error: `Too many files (max ${maxCount})` }, 400);
      }

      const mappedFiles = await Promise.all(
        files.map(async (f: any) => {
          if (!(f instanceof Object && 'arrayBuffer' in f)) return null;
          return {
            buffer: Buffer.from(await f.arrayBuffer()),
            mimetype: f.type,
            originalname: f.name || 'file',
            size: f.size
          };
        })
      );

      const filteredFiles = mappedFiles.filter(Boolean);

      // Store in context instead of modifying c.req.raw
      c.set('files', filteredFiles);
      c.set('parsedBody', body);

      return await next();
    } catch (error: any) {
      console.error('[Upload] Multiple middleware error:', error);
      return c.json({ error: error.message || 'File upload failed' }, 400);
    }
  };
};

// Helper to get file from request
export const getUploadedFile = (c: Context) => {
  return c.get('file');
};

// Helper to get multiple files from request
export const getUploadedFiles = (c: Context) => {
  return c.get('files') || [];
};

// Helper to get parsed body from middleware
export const getParsedBody = (c: Context) => {
  return c.get('parsedBody');
};
