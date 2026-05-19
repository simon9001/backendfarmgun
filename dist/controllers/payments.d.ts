import { Context } from 'hono';
export declare class PaymentsController {
    /**
     * PAYMENT FINITE STATE MACHINE
     * ─────────────────────────────────────────────────────────────────────────
     * States:  pending → success
     *          pending → failed
     *
     * Rules:
     *   - A booking can only have ONE pending payment row at a time.
     *   - When the user retries payment we UPDATE the existing pending row
     *     (new reference, same row) rather than inserting a second row.
     *   - If a payment moves to "failed" the booking can start a fresh attempt,
     *     which creates a new pending row (old one is already failed/done).
     *
     * Flow:
     *   1. GET pending payment for booking.
     *      A) None found → INSERT new pending row, trigger STK push.
     *      B) Found + no transaction_id → UPDATE reference, trigger STK push.
     *      C) Found + has transaction_id → already in flight; return existing ref.
     * ─────────────────────────────────────────────────────────────────────────
     */
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
    /**
     * Webhook handler — Paystack pushes charge.success / charge.failed here.
     * Uses transaction_id (reference) to find the payment row — never booking_id —
     * so there's no ambiguity even if old rows exist.
     */
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