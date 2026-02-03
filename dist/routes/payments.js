import { Hono } from 'hono';
import { PaymentsController } from '../controllers/payments.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
export const paymentRoutes = new Hono();
paymentRoutes.post('/initiate', authMiddleware, PaymentsController.initiatePayment);
paymentRoutes.post('/callback', PaymentsController.handlePaymentCallback);
paymentRoutes.get('/history', authMiddleware, PaymentsController.getPaymentHistory);
//# sourceMappingURL=payments.js.map