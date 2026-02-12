import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { authRoutes } from './routes/auth.js';
import { serviceRoutes } from './routes/services.js';
import { bookingRoutes } from './routes/bookings.js';
import { paymentRoutes } from './routes/payments.js';
import { notificationRoutes } from './routes/notifications.js';
import { adminRoutes } from './routes/admin.js';
import { publicRoutes } from './routes/public.js';
import { mediaRoutes } from './routes/media.js';
import { extractUser } from './middleware/authMiddleware.js';
import { env } from './db/envConfig.js';
const app = new Hono();
// === MIDDLEWARE ===
app.use('*', logger());
app.use('*', cors({
    origin: env.CORS_ORIGIN?.split(',') || ['https://www.farmwithirene.online'],
    credentials: true,
}));
app.use('*', extractUser);
// === HEALTH CHECK ===
app.get('/', (c) => {
    return c.json({
        message: 'Agriculture Consultation Platform API',
        version: '1.0.0',
        status: 'healthy',
        env: env.NODE_ENV
    });
});
// === PUBLIC ROUTES ===
app.route('/api/public', publicRoutes);
// === AUTH ROUTES ===
app.route('/api/auth', authRoutes);
// === MEDIA ROUTES ===
app.route('/api/media', mediaRoutes);
// === PROTECTED ROUTES ===
app.route('/api/services', serviceRoutes);
app.route('/api/bookings', bookingRoutes);
app.route('/api/payments', paymentRoutes);
app.route('/api/notifications', notificationRoutes);
// === ADMIN ROUTES ===
app.route('/api/admin', adminRoutes);
// === ERROR HANDLING ===
app.onError((err, c) => {
    console.error('Unhandled error:', err);
    return c.json({
        error: 'Internal server error',
        message: env.NODE_ENV === 'development' ? err.message : undefined
    }, 500);
});
app.notFound((c) => {
    return c.json({ error: 'Endpoint not found' }, 404);
});
// === START SERVER ===
const port = parseInt(env.PORT || '3001', 10);
serve({
    fetch: app.fetch,
    port
}, (info) => {
    console.log(`🚀 Server is running on http://localhost:${info.port}`);
    console.log(`📁 Environment: ${env.NODE_ENV}`);
    console.log(`🌐 CORS Origin: ${env.CORS_ORIGIN}`);
});
// === GRACEFUL SHUTDOWN ===
['SIGINT', 'SIGTERM'].forEach((signal) => {
    process.on(signal, () => {
        console.log(`Received ${signal}, shutting down gracefully...`);
        process.exit(0);
    });
});
//# sourceMappingURL=index.js.map