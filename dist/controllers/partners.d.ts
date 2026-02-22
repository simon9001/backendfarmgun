import { Context } from 'hono';
export declare class PartnersController {
    static getActivePartners(c: Context): Promise<(Response & import("hono").TypedResponse<never, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">)>;
    static getFeaturedPartners(c: Context): Promise<(Response & import("hono").TypedResponse<never, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">)>;
    static getAllPartners(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 403, "json">) | (Response & import("hono").TypedResponse<never, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">)>;
    static createPartner(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 403, "json">) | (Response & import("hono").TypedResponse<{
        partner: any;
    }, 201, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">)>;
    static updatePartner(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 403, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 404, "json">) | (Response & import("hono").TypedResponse<{
        partner: any;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">)>;
    static deletePartner(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 403, "json">) | (Response & import("hono").TypedResponse<{
        message: string;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">)>;
    static submitInterest(c: Context): Promise<(Response & import("hono").TypedResponse<{
        message: string;
        data: any;
    }, 201, "json">) | (Response & import("hono").TypedResponse<{
        error: any;
    }, 400, "json">)>;
}
//# sourceMappingURL=partners.d.ts.map