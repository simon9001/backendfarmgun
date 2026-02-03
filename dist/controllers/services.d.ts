import { Context } from 'hono';
export declare class ServicesController {
    static getAllServices(c: Context): Promise<(Response & import("hono").TypedResponse<never, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">)>;
    static getServiceById(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 404, "json">) | (Response & import("hono").TypedResponse<{
        service: any;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">)>;
    static createService(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 403, "json">) | (Response & import("hono").TypedResponse<{
        service: any;
    }, 201, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">)>;
    static updateService(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 403, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 404, "json">) | (Response & import("hono").TypedResponse<{
        service: any;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">)>;
    static deleteService(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 403, "json">) | (Response & import("hono").TypedResponse<{
        message: string;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">)>;
    static getAllCrops(c: Context): Promise<(Response & import("hono").TypedResponse<never, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">)>;
    static createCrop(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 403, "json">) | (Response & import("hono").TypedResponse<{
        crop: any;
    }, 201, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">)>;
    static linkCropToService(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 403, "json">) | (Response & import("hono").TypedResponse<{
        message: string;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">)>;
}
//# sourceMappingURL=services.d.ts.map