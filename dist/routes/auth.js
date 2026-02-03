import { Hono } from 'hono';
import { AuthController } from '../controllers/auth.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
export const authRoutes = new Hono();
authRoutes.post('/register', AuthController.register);
authRoutes.post('/login', AuthController.login);
authRoutes.get('/profile', authMiddleware, AuthController.getProfile);
//# sourceMappingURL=auth.js.map