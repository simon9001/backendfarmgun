import { supabase } from '../db/supabaseClient.js';
import { CloudinaryService } from '../utils/cloudinary.js';
import { getUploadedFile, getUploadedFiles, getFolderForCategory, getResourceType } from '../middleware/uploadMiddleware.js';
export class MediaController {
    static async uploadMedia(c) {
        try {
            const user = c.get('user');
            const file = getUploadedFile(c);
            if (!file) {
                return c.json({ error: 'No file uploaded' }, 400);
            }
            const body = await c.req.json();
            const { category, alt_text, description } = body;
            // Determine folder and resource type
            const folder = category ? getFolderForCategory(category) : 'general';
            const resourceType = getResourceType(file.mimetype);
            // Prepare upload options with proper typing
            const uploadOptions = {
                folder,
                resource_type: resourceType
            };
            // Add tags only if category exists
            if (category) {
                uploadOptions.tags = [category];
            }
            // Upload to Cloudinary
            const uploadResult = await CloudinaryService.uploadFile(file.buffer, uploadOptions);
            // Determine media type
            let mediaType = 'document';
            if (resourceType === 'image')
                mediaType = 'image';
            if (resourceType === 'video')
                mediaType = 'video';
            // Get MIME type
            const mimeType = CloudinaryService.getMimeTypeFromResourceType(uploadResult.resource_type, uploadResult.format);
            // Save to database
            const { data: media, error } = await supabase
                .from('media_library')
                .insert({
                public_id: uploadResult.public_id,
                url: uploadResult.secure_url,
                type: mediaType,
                category: category,
                alt_text,
                description,
                file_size: uploadResult.bytes,
                mime_type: mimeType,
                width: uploadResult.width,
                height: uploadResult.height,
                duration: uploadResult.duration,
                uploaded_by: user.userId,
            })
                .select()
                .single();
            if (error)
                throw error;
            return c.json({
                media,
                cloudinary_info: uploadResult
            }, 201);
        }
        catch (error) {
            console.error('Upload media error:', error);
            return c.json({ error: 'Failed to upload media' }, 500);
        }
    }
    static async uploadMultipleMedia(c) {
        try {
            const user = c.get('user');
            const files = getUploadedFiles(c);
            if (!files || files.length === 0) {
                return c.json({ error: 'No files uploaded' }, 400);
            }
            const body = await c.req.json();
            const { category, items } = body; // items can contain metadata for each file
            const uploadPromises = files.map(async (file, index) => {
                const itemMeta = items?.[index] || {};
                const folder = category ? getFolderForCategory(category) : 'general';
                const resourceType = getResourceType(file.mimetype);
                // Prepare upload options
                const uploadOptions = {
                    folder,
                    resource_type: resourceType
                };
                // Add tags only if category exists
                if (category) {
                    uploadOptions.tags = [category];
                }
                // Upload to Cloudinary
                const uploadResult = await CloudinaryService.uploadFile(file.buffer, uploadOptions);
                // Determine media type
                let mediaType = 'document';
                if (resourceType === 'image')
                    mediaType = 'image';
                if (resourceType === 'video')
                    mediaType = 'video';
                // Get MIME type
                const mimeType = CloudinaryService.getMimeTypeFromResourceType(uploadResult.resource_type, uploadResult.format);
                // Save to database
                const { data: media, error } = await supabase
                    .from('media_library')
                    .insert({
                    public_id: uploadResult.public_id,
                    url: uploadResult.secure_url,
                    type: mediaType,
                    category: category,
                    alt_text: itemMeta.alt_text,
                    description: itemMeta.description,
                    file_size: uploadResult.bytes,
                    mime_type: mimeType,
                    width: uploadResult.width,
                    height: uploadResult.height,
                    duration: uploadResult.duration,
                    uploaded_by: user.userId,
                })
                    .select()
                    .single();
                if (error)
                    throw error;
                return {
                    media,
                    cloudinary_info: uploadResult
                };
            });
            const results = await Promise.all(uploadPromises);
            return c.json({
                results,
                message: `${files.length} files uploaded successfully`
            }, 201);
        }
        catch (error) {
            console.error('Upload multiple media error:', error);
            return c.json({ error: 'Failed to upload media' }, 500);
        }
    }
    static async getMedia(c) {
        try {
            const { category, type, limit = '50', offset = '0' } = c.req.query();
            // Convert string parameters to numbers
            const limitNum = parseInt(limit, 10);
            const offsetNum = parseInt(offset, 10);
            if (isNaN(limitNum) || isNaN(offsetNum)) {
                return c.json({ error: 'Invalid limit or offset parameter' }, 400);
            }
            let query = supabase
                .from('media_library')
                .select('*')
                .order('created_at', { ascending: false })
                .range(offsetNum, offsetNum + limitNum - 1);
            if (category) {
                query = query.eq('category', category);
            }
            if (type) {
                query = query.eq('type', type);
            }
            const { data: media, error } = await query;
            if (error)
                throw error;
            return c.json({ media: media || [] });
        }
        catch (error) {
            console.error('Get media error:', error);
            return c.json({ error: 'Failed to fetch media' }, 500);
        }
    }
    static async getMediaById(c) {
        try {
            const id = c.req.param('id');
            const { data: media, error } = await supabase
                .from('media_library')
                .select(`
          *,
          uploaded_by_user:users(name, email)
        `)
                .eq('id', id)
                .single();
            if (error || !media) {
                return c.json({ error: 'Media not found' }, 404);
            }
            // Get additional info from Cloudinary
            try {
                const cloudinaryInfo = await CloudinaryService.getResourceInfo(media.public_id);
                return c.json({
                    media,
                    cloudinary_info: cloudinaryInfo
                });
            }
            catch (cloudinaryError) {
                // If Cloudinary fails, still return DB info
                return c.json({
                    media,
                    warning: 'Could not fetch Cloudinary details'
                });
            }
        }
        catch (error) {
            console.error('Get media by ID error:', error);
            return c.json({ error: 'Failed to fetch media' }, 500);
        }
    }
    static async deleteMedia(c) {
        try {
            const user = c.get('user');
            const id = c.req.param('id');
            // Get media info first
            const { data: media, error: fetchError } = await supabase
                .from('media_library')
                .select('*')
                .eq('id', id)
                .single();
            if (fetchError || !media) {
                return c.json({ error: 'Media not found' }, 404);
            }
            // Check permission (admin or uploader)
            if (user.role !== 'admin' && media.uploaded_by !== user.userId) {
                return c.json({ error: 'Unauthorized' }, 403);
            }
            // Delete from Cloudinary
            await CloudinaryService.deleteFile(media.public_id);
            // Delete from database
            const { error: deleteError } = await supabase
                .from('media_library')
                .delete()
                .eq('id', id);
            if (deleteError)
                throw deleteError;
            return c.json({
                message: 'Media deleted successfully',
                deleted_media: media
            });
        }
        catch (error) {
            console.error('Delete media error:', error);
            return c.json({ error: 'Failed to delete media' }, 500);
        }
    }
    static async updateMedia(c) {
        try {
            const user = c.get('user');
            const id = c.req.param('id');
            const { alt_text, description, category } = await c.req.json();
            // Get media info first
            const { data: existingMedia, error: fetchError } = await supabase
                .from('media_library')
                .select('*')
                .eq('id', id)
                .single();
            if (fetchError || !existingMedia) {
                return c.json({ error: 'Media not found' }, 404);
            }
            // Check permission (admin or uploader)
            if (user.role !== 'admin' && existingMedia.uploaded_by !== user.userId) {
                return c.json({ error: 'Unauthorized' }, 403);
            }
            const updateData = {};
            if (alt_text !== undefined)
                updateData.alt_text = alt_text;
            if (description !== undefined)
                updateData.description = description;
            if (category !== undefined)
                updateData.category = category;
            const { data: media, error } = await supabase
                .from('media_library')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();
            if (error)
                throw error;
            return c.json({ media });
        }
        catch (error) {
            console.error('Update media error:', error);
            return c.json({ error: 'Failed to update media' }, 400);
        }
    }
    static async getOptimizedUrl(c) {
        try {
            const id = c.req.param('id');
            const { width, height, crop, quality, format } = c.req.query();
            // Get media info
            const { data: media, error } = await supabase
                .from('media_library')
                .select('public_id')
                .eq('id', id)
                .single();
            if (error || !media) {
                return c.json({ error: 'Media not found' }, 404);
            }
            // Prepare optimization options with proper typing
            const optimizationOptions = {};
            // Add properties only if they exist
            if (width) {
                const widthNum = parseInt(width, 10);
                if (!isNaN(widthNum)) {
                    optimizationOptions.width = widthNum;
                }
            }
            if (height) {
                const heightNum = parseInt(height, 10);
                if (!isNaN(heightNum)) {
                    optimizationOptions.height = heightNum;
                }
            }
            if (crop) {
                optimizationOptions.crop = crop;
            }
            if (quality) {
                const qualityNum = parseInt(quality, 10);
                if (!isNaN(qualityNum)) {
                    optimizationOptions.quality = qualityNum;
                }
            }
            if (format) {
                optimizationOptions.format = format;
            }
            const optimizedUrl = CloudinaryService.getOptimizedImageUrl(media.public_id, optimizationOptions);
            return c.json({
                original_id: id,
                public_id: media.public_id,
                optimized_url: optimizedUrl
            });
        }
        catch (error) {
            console.error('Get optimized URL error:', error);
            return c.json({ error: 'Failed to generate optimized URL' }, 500);
        }
    }
    static async uploadFromUrl(c) {
        try {
            const user = c.get('user');
            const { url, category, alt_text, description } = await c.req.json();
            if (!url) {
                return c.json({ error: 'URL is required' }, 400);
            }
            const folder = category ? getFolderForCategory(category) : 'general';
            // Prepare upload options
            const uploadOptions = {
                folder
            };
            // Add tags only if category exists
            if (category) {
                uploadOptions.tags = [category];
            }
            // Upload from URL to Cloudinary
            const uploadResult = await CloudinaryService.uploadFromUrl(url, uploadOptions);
            // Determine media type
            let mediaType = 'document';
            if (uploadResult.resource_type === 'image')
                mediaType = 'image';
            if (uploadResult.resource_type === 'video')
                mediaType = 'video';
            // Get MIME type
            const mimeType = CloudinaryService.getMimeTypeFromResourceType(uploadResult.resource_type, uploadResult.format);
            // Save to database
            const { data: media, error } = await supabase
                .from('media_library')
                .insert({
                public_id: uploadResult.public_id,
                url: uploadResult.secure_url,
                type: mediaType,
                category: category,
                alt_text,
                description,
                file_size: uploadResult.bytes,
                mime_type: mimeType,
                width: uploadResult.width,
                height: uploadResult.height,
                duration: uploadResult.duration,
                uploaded_by: user.userId,
            })
                .select()
                .single();
            if (error)
                throw error;
            return c.json({
                media,
                cloudinary_info: uploadResult
            }, 201);
        }
        catch (error) {
            console.error('Upload from URL error:', error);
            return c.json({ error: 'Failed to upload from URL' }, 500);
        }
    }
}
//# sourceMappingURL=media.js.map