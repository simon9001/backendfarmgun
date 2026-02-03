import { Context } from 'hono';
export declare class PaymentsController {
    static initiatePayment(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 404, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">) | (Response & import("hono").TypedResponse<{
        payment: any;
        daraja_payload: {
            BusinessShortCode: string;
            Password: string;
            Timestamp: string;
            TransactionType: string;
            Amount: any;
            PartyA: string;
            PartyB: string;
            PhoneNumber: string;
            CallBackURL: string;
            AccountReference: string;
            TransactionDesc: string;
        };
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">)>;
    static handlePaymentCallback(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 404, "json">) | (Response & import("hono").TypedResponse<{
        message: string;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">)>;
    static getPaymentHistory(c: Context): Promise<(Response & import("hono").TypedResponse<never, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">)>;
}
//# sourceMappingURL=payments.d.ts.map