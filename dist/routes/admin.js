import { Hono } from 'hono';
import { AdminController } from '../controllers/admin.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/authMiddleware.js';
export const adminRoutes = new Hono();
// Apply auth middleware to all admin routes
adminRoutes.use('*', authMiddleware);
adminRoutes.use('*', adminOnly);
// Dashboard
adminRoutes.get('/dashboard/stats', AdminController.getDashboardStats);
// Services Management
adminRoutes.post('/services', AdminController.createService);
adminRoutes.patch('/services/:id', AdminController.updateService);
adminRoutes.delete('/services/:id', AdminController.deleteService);
adminRoutes.post('/services/link-crop', AdminController.linkCropToService);
adminRoutes.delete('/services/unlink-crop', AdminController.unlinkCropFromService);
// Crops Management
adminRoutes.post('/crops', AdminController.createCrop);
adminRoutes.patch('/crops/:id', AdminController.updateCrop);
adminRoutes.delete('/crops/:id', AdminController.deleteCrop);
// Projects Management
adminRoutes.post('/projects', AdminController.createProject);
adminRoutes.patch('/projects/:id', AdminController.updateProject);
adminRoutes.delete('/projects/:id', AdminController.deleteProject);
adminRoutes.post('/projects/:id/media', AdminController.addProjectMedia);
adminRoutes.delete('/projects/media/:mediaId', AdminController.removeProjectMedia);
// Testimonials Management
adminRoutes.post('/testimonials', AdminController.createTestimonial);
adminRoutes.patch('/testimonials/:id', AdminController.updateTestimonial);
adminRoutes.delete('/testimonials/:id', AdminController.deleteTestimonial);
adminRoutes.patch('/testimonials/:id/approve', AdminController.approveTestimonial);
// Tips/Blog Management
adminRoutes.post('/tips', AdminController.createTip);
adminRoutes.patch('/tips/:id', AdminController.updateTip);
adminRoutes.delete('/tips/:id', AdminController.deleteTip);
adminRoutes.post('/tips/:id/media', AdminController.addTipMedia);
// Bookings Management
adminRoutes.get('/bookings', AdminController.getAllBookings);
adminRoutes.patch('/bookings/:id', AdminController.updateBooking);
adminRoutes.delete('/bookings/:id/cancel', AdminController.cancelBookingAdmin);
// Users Management
adminRoutes.get('/users', AdminController.getAllUsers);
adminRoutes.get('/users/:id', AdminController.getUserDetails);
adminRoutes.patch('/users/:id/role', AdminController.updateUserRole);
// Availability Management
adminRoutes.post('/availability', AdminController.setAvailability);
adminRoutes.get('/availability', AdminController.getAvailability);
// System Settings
adminRoutes.get('/settings', AdminController.getSystemSettings);
adminRoutes.patch('/settings', AdminController.updateSystemSettings);
// Data Export
adminRoutes.get('/export', AdminController.exportData);
//# sourceMappingURL=admin.js.map