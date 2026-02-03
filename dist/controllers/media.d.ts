import { Context } from 'hono';
export declare class MediaController {
    static uploadMedia(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">) | (Response & import("hono").TypedResponse<{
        media: any;
        cloudinary_info: {
            public_id: string;
            url: string;
            secure_url: string;
            format: string;
            resource_type: string;
            bytes: number;
            width?: number | undefined;
            height?: number | undefined;
            duration?: number | undefined;
        };
    }, 201, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">)>;
    static uploadMultipleMedia(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">) | (Response & import("hono").TypedResponse<{
        results: any[];
        message: string;
    }, 201, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">)>;
    static getMedia(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">) | (Response & import("hono").TypedResponse<never, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">)>;
    static getMediaById(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 404, "json">) | (Response & import("hono").TypedResponse<{
        media: any;
        cloudinary_info: any;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        media: any;
        warning: string;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">)>;
    static deleteMedia(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 404, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 403, "json">) | (Response & import("hono").TypedResponse<{
        message: string;
        deleted_media: any;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">)>;
    static updateMedia(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 404, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 403, "json">) | (Response & import("hono").TypedResponse<{
        media: any;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">)>;
    static getOptimizedUrl(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 404, "json">) | (Response & import("hono").TypedResponse<{
        original_id: string;
        public_id: any;
        optimized_url: string;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">)>;
    static uploadFromUrl(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">) | (Response & import("hono").TypedResponse<{
        media: any;
        cloudinary_info: any;
    }, 201, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">)>;
}
//# sourceMappingURL=media.d.ts.map