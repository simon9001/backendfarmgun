import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

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

export class CloudinaryService {
  static async uploadFile(
    fileBuffer: Buffer,
    options: UploadOptions = {}
  ): Promise<{
    public_id: string;
    url: string;
    secure_url: string;
    format: string;
    resource_type: string;
    bytes: number;
    width?: number;
    height?: number;
    duration?: number;
  }> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        ({
          folder: options.folder || 'agriculture-platform',
          resource_type: (options.resource_type as any) || 'auto',
          ...(options.public_id && { public_id: options.public_id }),
          ...(options.transformation && { transformation: options.transformation as any }),
          ...(options.tags && { tags: options.tags }),
        } as any),
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve({
              public_id: result.public_id,
              url: result.url,
              secure_url: result.secure_url,
              format: result.format,
              resource_type: result.resource_type,
              bytes: result.bytes,
              width: result.width,
              height: result.height,
              duration: result.duration,
            });
          } else {
            reject(new Error('Upload failed'));
          }
        }
      );

      const readableStream = new Readable();
      readableStream.push(fileBuffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });
  }

  static async uploadFromUrl(
    url: string,
    options: UploadOptions = {}
  ): Promise<any> {
    const uploadOptions: any = {
      folder: options.folder || 'agriculture-platform',
      resource_type: (options.resource_type as any) || 'auto',
    };

    if (options.public_id) uploadOptions.public_id = options.public_id;
    if (options.transformation) uploadOptions.transformation = options.transformation;
    if (options.tags) uploadOptions.tags = options.tags;

    return cloudinary.uploader.upload(url, uploadOptions);
  }

  static async deleteFile(publicId: string): Promise<any> {
    return cloudinary.uploader.destroy(publicId);
  }

  static async generateSignedUrl(
    publicId: string,
    options: {
      transformation?: TransformationOptions[];
      format?: string;
      type?: string;
    } = {}
  ): Promise<string> {
    return cloudinary.url(publicId, {
      secure: true,
      sign_url: true,
      ...options,
    } as any);
  }

  static async getResourceInfo(publicId: string): Promise<any> {
    return cloudinary.api.resource(publicId);
  }

  static async listResources(folder?: string): Promise<any> {
    return cloudinary.api.resources({
      type: 'upload',
      prefix: folder,
      max_results: 100,
    });
  }

  // Helper to get MIME type from Cloudinary resource type
  static getMimeTypeFromResourceType(resourceType: string, format: string): string {
    const mimeTypes: Record<string, Record<string, string>> = {
      image: {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        svg: 'image/svg+xml',
      },
      video: {
        mp4: 'video/mp4',
        mov: 'video/quicktime',
        avi: 'video/x-msvideo',
        mkv: 'video/x-matroska',
        webm: 'video/webm',
      },
      raw: {
        pdf: 'application/pdf',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        xls: 'application/vnd.ms-excel',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        txt: 'text/plain',
      },
    };

    return mimeTypes[resourceType]?.[format.toLowerCase()] || 'application/octet-stream';
  }

  // Get optimized image URL with transformations
  static getOptimizedImageUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: number;
      format?: string;
    } = {}
  ): string {
    const transformations: TransformationOptions = {};

    if (options.width) {
      transformations.width = options.width;
    }
    if (options.height) {
      transformations.height = options.height;
    }
    if (options.width || options.height) {
      transformations.crop = options.crop || 'fill';
    }

    if (options.quality) {
      transformations.quality = options.quality;
    } else {
      transformations.quality = 'auto';
    }

    transformations.fetch_format = options.format || 'auto';

    const config: any = {
      secure: true,
    };

    if (Object.keys(transformations).length > 0) {
      config.transformation = [transformations];
    }

    return cloudinary.url(publicId, config);
  }
}