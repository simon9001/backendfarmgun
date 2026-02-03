import type { Context, Next } from 'hono';
import type { AuthTokenPayload } from '../types/index.js';
declare module 'hono' {
    interface ContextVariableMap {
        user: AuthTokenPayload;
    }
}
export declare const authMiddleware: import("hono").MiddlewareHandler;
export declare const adminOnly: (c: Context, next: Next) => Promise<void | (Response & import("hono").TypedResponse<{
    error: string;
}, 403, "json">)>;
export declare const extractUser: (c: Context, next: Next) => Promise<void>;
export declare const requireAuth: (c: Context, next: Next) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 401, "json">) | undefined>;
//# sourceMappingURL=authMiddleware.d.ts.map