import { Context, Next } from 'hono';
export declare const uploadSingle: (fieldName: string) => (c: Context, next: Next) => Promise<void | (Response & import("hono").TypedResponse<{
    error: any;
}, 400, "json">)>;
export declare const uploadMultiple: (fieldName: string, maxCount?: number) => (c: Context, next: Next) => Promise<void | (Response & import("hono").TypedResponse<{
    error: any;
}, 400, "json">)>;
export declare const getUploadedFile: (c: Context) => any;
export declare const getUploadedFiles: (c: Context) => any;
export declare const getFolderForCategory: (category: string) => string;
export declare const getResourceType: (mimeType: string) => "image" | "video" | "raw" | "auto";
//# sourceMappingURL=uploadMiddleware.d.ts.map