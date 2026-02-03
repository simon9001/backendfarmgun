import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server'; // ADD THIS
import { authRoutes } from './routes/auth.js';
import { serviceRoutes } from './routes/services.js';
import { bookingRoutes } from './routes/bookings.js';
import { paymentRoutes } from './routes/payments.js';
import { notificationRoutes } from './routes/notifications.js';
import { adminRoutes } from './routes/admin.js';
import { publicRoutes } from './routes/public.js';
import { mediaRoutes } from './routes/media.js';
import { extractUser } from './middleware/authMiddleware.js';
import { env } from './db/envConfig.js'; // IMPORT ENV CONFIG
const app = new Hono();
// Middleware
app.use('*', logger());
app.use('*', cors({
    origin: env.CORS_ORIGIN?.split(',') || ['http://localhost:5174'],
    credentials: true,
}));
app.use('*', extractUser);
// Health check
app.get('/', (c) => {
    return c.json({
        message: 'Agriculture Consultation Platform API',
        version: '1.0.0',
        status: 'healthy',
        env: env.NODE_ENV
    });
});
// Public routes
app.route('/api/public', publicRoutes);
// Auth routes
app.route('/api/auth', authRoutes);
// Media routes
app.route('/api/media', mediaRoutes);
// Protected routes
app.route('/api/services', serviceRoutes);
app.route('/api/bookings', bookingRoutes);
app.route('/api/payments', paymentRoutes);
app.route('/api/notifications', notificationRoutes);
// Admin routes
app.route('/api/admin', adminRoutes);
// Error handling
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
const port = parseInt(env.PORT || '3001');
// ACTUALLY START THE SERVER
serve({
    fetch: app.fetch,
    port
}, (info) => {
    console.log(`🚀 Server is running on http://localhost:${info.port}`);
    console.log(`📁 Environment: ${env.NODE_ENV}`);
    console.log(`🌐 CORS Origin: ${env.CORS_ORIGIN}`);
});
// Optional: Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    process.exit(0);
});
process.on('SIGTERM', () => {
    console.log('Shutting down server...');
    process.exit(0);
});
//# sourceMappingURL=index.js.map