import { Hono } from 'hono';
import { MediaController } from '../controllers/media.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { uploadSingle, uploadMultiple } from '../middleware/uploadMiddleware.js';
export const mediaRoutes = new Hono();
// Upload single file
mediaRoutes.post('/upload', authMiddleware, uploadSingle('file'), MediaController.uploadMedia);
// Upload multiple files
mediaRoutes.post('/upload/multiple', authMiddleware, uploadMultiple('files', 10), MediaController.uploadMultipleMedia);
// Upload from URL
mediaRoutes.post('/upload/url', authMiddleware, MediaController.uploadFromUrl);
// Get all media
mediaRoutes.get('/', MediaController.getMedia);
// Get media by ID
mediaRoutes.get('/:id', MediaController.getMediaById);
// Get optimized URL
mediaRoutes.get('/:id/optimized', MediaController.getOptimizedUrl);
// Update media metadata
mediaRoutes.patch('/:id', authMiddleware, MediaController.updateMedia);
// Delete media
mediaRoutes.delete('/:id', authMiddleware, MediaController.deleteMedia);
//# sourceMappingURL=media.js.map