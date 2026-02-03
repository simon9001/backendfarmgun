import { Hono } from 'hono';
import { BookingsController } from '../controllers/bookings.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
export const bookingRoutes = new Hono();
bookingRoutes.get('/slots', BookingsController.getAvailableSlots);
bookingRoutes.post('/', authMiddleware, BookingsController.createBooking);
bookingRoutes.get('/', authMiddleware, BookingsController.getUserBookings);
bookingRoutes.get('/:id', authMiddleware, BookingsController.getBookingById);
bookingRoutes.patch('/:id/status', authMiddleware, BookingsController.updateBookingStatus);
bookingRoutes.delete('/:id', authMiddleware, BookingsController.cancelBooking);
//# sourceMappingURL=bookings.js.map