export interface TransformationOptions {
    width?: number | string;
    height?: number | string;
    crop?: string;
    quality?: string | number;
    format?: string;
    [key: string]: any;
}
export interface UploadOptions {
    folder?: string;
    public_id?: string;
    resource_type?: 'image' | 'video' | 'raw' | 'auto';
    transformation?: TransformationOptions[];
    tags?: string[];
}
export declare class CloudinaryService {
    static uploadFile(fileBuffer: Buffer, options?: UploadOptions): Promise<{
        public_id: string;
        url: string;
        secure_url: string;
        format: string;
        resource_type: string;
        bytes: number;
        width?: number;
        height?: number;
        duration?: number;
    }>;
    static uploadFromUrl(url: string, options?: UploadOptions): Promise<any>;
    static deleteFile(publicId: string): Promise<any>;
    static generateSignedUrl(publicId: string, options?: {
        transformation?: TransformationOptions[];
        format?: string;
        type?: string;
    }): Promise<string>;
    static getResourceInfo(publicId: string): Promise<any>;
    static listResources(folder?: string): Promise<any>;
    static getMimeTypeFromResourceType(resourceType: string, format: string): string;
    static getOptimizedImageUrl(publicId: string, options?: {
        width?: number;
        height?: number;
        crop?: string;
        quality?: number;
        format?: string;
    }): string;
}
//# sourceMappingURL=cloudinary.d.ts.map