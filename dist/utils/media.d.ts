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
export declare const optimizeMedia: (media: FeaturedMedia | null, options: OptimizeOptions) => FeaturedMedia | null;
//# sourceMappingURL=media.d.ts.map