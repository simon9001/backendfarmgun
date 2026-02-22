import { Context } from 'hono';
export declare class PaymentsController {
    static initiatePayment(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 404, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">) | (Response & import("hono").TypedResponse<{
        status: any;
        message: any;
        reference: any;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: any;
    }, 400, "json">)>;
    static verifyPayment(c: Context): Promise<(Response & import("hono").TypedResponse<{
        status: any;
        message: string;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        status: string;
        booking: any;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: any;
    }, 400, "json">)>;
    static handlePaymentCallback(c: Context): Promise<(Response & import("hono").TypedResponse<{
        received: true;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">)>;
    static getPaymentHistory(c: Context): Promise<(Response & import("hono").TypedResponse<never, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">)>;
}
//# sourceMappingURL=payments.d.ts.map