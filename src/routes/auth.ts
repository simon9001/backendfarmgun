import { Hono } from 'hono';
import { AuthController } from '../controllers/auth.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

export const authRoutes = new Hono();

authRoutes.post('/register', AuthController.register);
authRoutes.post('/login', AuthController.login);
authRoutes.post('/forgot-password', AuthController.forgotPassword);
authRoutes.post('/reset-password', AuthController.resetPassword);
authRoutes.post('/logout', authMiddleware, AuthController.logout);
authRoutes.get('/profile', authMiddleware, AuthController.getProfile);
