import { Hono } from 'hono';
import { AdminController } from '../controllers/admin.js';
import { authMiddleware, adminOnly } from '../middleware/authMiddleware.js';
import { uploadSingle } from '../middleware/uploadMiddleware.js';
import { supabase } from '../db/supabaseClient.js';
import { cropPriceSchema } from '../utils/validation.js';

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
adminRoutes.post('/projects', uploadSingle('file'), AdminController.createProject);
adminRoutes.patch('/projects/:id', uploadSingle('file'), AdminController.updateProject);
adminRoutes.delete('/projects/:id', AdminController.deleteProject);
adminRoutes.post('/projects/:id/media', AdminController.addProjectMedia);
adminRoutes.delete('/projects/media/:mediaId', AdminController.removeProjectMedia);

// Testimonials Management
adminRoutes.post('/testimonials', AdminController.createTestimonial);
adminRoutes.patch('/testimonials/:id', AdminController.updateTestimonial);
adminRoutes.delete('/testimonials/:id', AdminController.deleteTestimonial);
adminRoutes.patch('/testimonials/:id/approve', AdminController.approveTestimonial);

// Tips Management
adminRoutes.get('/tips', AdminController.getAllTips);
adminRoutes.post('/tips', AdminController.createTip);
adminRoutes.patch('/tips/:id', AdminController.updateTip);
adminRoutes.delete('/tips/:id', AdminController.deleteTip);
adminRoutes.post('/tips/:id/media', AdminController.addTipMedia);

// Blogs Management
adminRoutes.get('/blogs', AdminController.getAllBlogs);
adminRoutes.post('/blogs', AdminController.createBlog);
adminRoutes.patch('/blogs/:id', AdminController.updateBlog);
adminRoutes.delete('/blogs/:id', AdminController.deleteBlog);
adminRoutes.post('/blogs/:id/media', AdminController.addBlogMedia);

// Bookings Management
adminRoutes.get('/bookings', AdminController.getAllBookings);
adminRoutes.patch('/bookings/:id', AdminController.updateBooking);
adminRoutes.post('/bookings/:id/reschedule', AdminController.rescheduleBooking);
adminRoutes.delete('/bookings/:id', AdminController.deleteBooking);
adminRoutes.delete('/bookings/:id/cancel', AdminController.cancelBookingAdmin);

// Users Management
adminRoutes.get('/users', AdminController.getAllUsers);
adminRoutes.get('/users/:id', AdminController.getUserDetails);
adminRoutes.patch('/users/:id/role', AdminController.updateUserRole);
adminRoutes.delete('/users/:id', AdminController.deleteUser);

// Availability Management
adminRoutes.post('/availability', AdminController.setAvailability);
adminRoutes.get('/availability', AdminController.getAvailability);

// System Settings
adminRoutes.get('/settings', AdminController.getSystemSettings);
adminRoutes.patch('/settings', AdminController.updateSystemSettings);

// Data Export
adminRoutes.get('/export', AdminController.exportData);

// Crop Prices Management (admin only — auth + adminOnly already applied globally above)
adminRoutes.get('/crop-prices', async (c) => {
  const { limit = '100', offset = '0', date } = c.req.query();

  const limitNum = parseInt(limit, 10);
  const offsetNum = parseInt(offset, 10);

  if (isNaN(limitNum) || isNaN(offsetNum) || limitNum < 1 || limitNum > 500 || offsetNum < 0) {
    return c.json({ error: 'Invalid pagination parameters' }, 400);
  }

  let query = supabase
    .from('crop_prices')
    .select('*', { count: 'exact' })
    .order('price_date', { ascending: false })
    .order('crop_name', { ascending: true })
    .range(offsetNum, offsetNum + limitNum - 1);

  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    query = query.eq('price_date', date);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Admin crop prices fetch error:', error);
    return c.json({ error: 'Failed to fetch crop prices' }, 500);
  }

  return c.json({ prices: data || [], meta: { count: count || 0, limit: limitNum, offset: offsetNum } });
});

adminRoutes.post('/crop-prices', async (c) => {
  const user = c.get('user');
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const result = cropPriceSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: 'Validation failed', details: result.error.flatten().fieldErrors }, 422);
  }

  const { data, error } = await supabase
    .from('crop_prices')
    .insert({ ...result.data, created_by: user.userId })
    .select()
    .single();

  if (error) {
    console.error('Crop price create error:', error);
    return c.json({ error: 'Failed to create crop price entry' }, 500);
  }

  return c.json({ price: data }, 201);
});

adminRoutes.patch('/crop-prices/:id', async (c) => {
  const id = c.req.param('id');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return c.json({ error: 'Invalid ID' }, 400);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const result = cropPriceSchema.partial().safeParse(body);
  if (!result.success) {
    return c.json({ error: 'Validation failed', details: result.error.flatten().fieldErrors }, 422);
  }

  const { data, error } = await supabase
    .from('crop_prices')
    .update({ ...result.data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Crop price update error:', error);
    return c.json({ error: 'Failed to update crop price entry' }, 500);
  }

  if (!data) return c.json({ error: 'Crop price entry not found' }, 404);

  return c.json({ price: data });
});

adminRoutes.delete('/crop-prices/:id', async (c) => {
  const id = c.req.param('id');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return c.json({ error: 'Invalid ID' }, 400);
  }

  const { error } = await supabase
    .from('crop_prices')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Crop price delete error:', error);
    return c.json({ error: 'Failed to delete crop price entry' }, 500);
  }

  return c.json({ success: true });
});