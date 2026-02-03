import { Hono } from 'hono';
import { NotificationsController } from '../controllers/notifications.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

export const notificationRoutes = new Hono();

notificationRoutes.get('/', authMiddleware, NotificationsController.getUserNotifications);
notificationRoutes.patch('/:id/read', authMiddleware, NotificationsController.markAsRead);
notificationRoutes.patch('/read-all', authMiddleware, NotificationsController.markAllAsRead);
notificationRoutes.post('/send', authMiddleware, NotificationsController.sendNotification);