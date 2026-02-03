import { jwt } from 'hono/jwt';
import jwtModule from 'jsonwebtoken'; // Fix for ESM import
const { verify } = jwtModule;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
// JWT middleware for protected routes
export const authMiddleware = jwt({
    secret: JWT_SECRET,
    alg: 'HS256', // Specify the algorithm
});
// Middleware to require admin role
export const adminOnly = async (c, next) => {
    const user = c.get('user');
    if (user.role !== 'admin') {
        return c.json({ error: 'Admin access required' }, 403);
    }
    return await next();
};
// Optional middleware to extract user from token for public routes
export const extractUser = async (c, next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        await next();
        return;
    }
    const token = authHeader.split(' ')[1];
    // Check if token exists
    if (!token) {
        await next();
        return;
    }
    try {
        const payload = verify(token, JWT_SECRET);
        // Type assertion with proper type checking
        if (typeof payload === 'object' && payload !== null && 'userId' in payload && 'role' in payload) {
            c.set('user', payload);
        }
    }
    catch (error) {
        // Invalid token, proceed without user
        console.debug('Invalid token or no user:', error.message);
    }
    await next();
};
// Middleware to require authentication (stricter version)
export const requireAuth = async (c, next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return c.json({ error: 'Authentication required' }, 401);
    }
    const token = authHeader.split(' ')[1];
    // Check if token exists
    if (!token) {
        return c.json({ error: 'Token missing from authorization header' }, 401);
    }
    try {
        const payload = verify(token, JWT_SECRET);
        // Type assertion with proper type checking
        if (typeof payload === 'object' && payload !== null && 'userId' in payload && 'role' in payload) {
            c.set('user', payload);
            await next();
            return; // Explicit return to satisfy TypeScript
        }
        else {
            return c.json({ error: 'Invalid token payload' }, 401);
        }
    }
    catch (error) {
        return c.json({ error: 'Invalid or expired token' }, 401);
    }
};
//# sourceMappingURL=authMiddleware.js.map