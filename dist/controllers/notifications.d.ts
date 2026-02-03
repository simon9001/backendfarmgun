import { Context } from 'hono';
export declare class NotificationsController {
    static getUserNotifications(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">) | (Response & import("hono").TypedResponse<never, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 500, "json">)>;
    static markAsRead(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 404, "json">) | (Response & import("hono").TypedResponse<{
        notification: any;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">)>;
    static markAllAsRead(c: Context): Promise<(Response & import("hono").TypedResponse<{
        message: string;
    }, import("hono/utils/http-status").ContentfulStatusCode, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">)>;
    static sendNotification(c: Context): Promise<(Response & import("hono").TypedResponse<{
        error: string;
    }, 403, "json">) | (Response & import("hono").TypedResponse<{
        notification: any;
    }, 201, "json">) | (Response & import("hono").TypedResponse<{
        error: string;
    }, 400, "json">)>;
}
//# sourceMappingURL=notifications.d.ts.map