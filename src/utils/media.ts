import { CloudinaryService } from './cloudinary.js';

export interface FeaturedMedia {
    id: string;
    public_id: string;
    url: string;
    type?: string;
    alt_text?: string;
    width?: number;
    height?: number;
    description?: string;
    mime_type?: string;
    optimized_url?: string;
    thumbnail_url?: string;
}

export interface OptimizeOptions {
    width?: number;
    height?: number;
    quality?: number;
    crop?: string;
}

/**
 * Optimizes media metadata by adding Cloudinary transformation URLs
 * @param media The media object from the database
 * @param options Optimization options (width, height, etc.)
 * @returns The media object with optimized_url and thumbnail_url added
 */
export const optimizeMedia = (media: FeaturedMedia | null, options: OptimizeOptions) => {
    if (!media || !media.public_id) return media;

    const isCloudinary = media.url?.includes('res.cloudinary.com');
    const isPlaceholder = ['hero-image', 'service-image', 'tip-image', 'crop-image', 'project-image', 'partner-logo'].includes(media.public_id);

    if (isCloudinary && !isPlaceholder) {
        // Extract version if present in URL
        const versionMatch = media.url?.match(/\/v(\d+)\//);
        const version = versionMatch ? versionMatch[1] : undefined;

        return {
            ...media,
            optimized_url: CloudinaryService.getOptimizedImageUrl(media.public_id, {
                ...options,
                // @ts-ignore
                version,
            }),
            thumbnail_url: CloudinaryService.getOptimizedImageUrl(media.public_id, {
                width: 200,
                height: 150,
                crop: 'fill',
                quality: 60,
                // @ts-ignore
                version,
            }),
        };
    }

    return media;
};
