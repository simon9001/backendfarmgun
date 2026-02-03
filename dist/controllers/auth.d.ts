import type { Context } from 'hono';
export declare class AuthController {
    static register(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 409, "json">) | (Response & import("hono").TypedResponse<{
        user: {
            id: any;
            name: any;
            email: any;
            phone: any;
            role: any;
        };
        token: string;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">)>;
    static login(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 401, "json">) | (Response & import("hono").TypedResponse<{
        user: {
            id: any;
            name: any;
            email: any;
            phone: any;
            role: any;
        };
        token: string;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">)>;
    static getProfile(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 404, "json">) | (Response & import("hono").TypedResponse<{
        user: any;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">)>;
}
//# sourceMappingURL=auth.d.ts.map