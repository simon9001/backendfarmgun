import { supabase } from '../db/supabaseClient.js';
import { projectSchema, testimonialSchema, tipSchema, serviceSchema, cropSchema, availabilitySchema } from '../utils/validation.js';
import { CloudinaryService } from '../utils/cloudinary.js';
import { getUploadedFile, getFolderForCategory, getResourceType } from '../middleware/uploadMiddleware.js';
export class AdminController {
    // ==================== DASHBOARD ====================
    static async getDashboardStats(c) {
        try {
            const user = c.get('user');
            if (user.role !== 'admin') {
                return c.json({ error: 'Admin access required' }, 403);
            }
            const { period = 'month' } = c.req.query(); // day, week, month, year
            const now = new Date();
            let startDate = new Date();
            switch (period) {
                case 'day':
                    startDate.setDate(now.getDate() - 1);
                    break;
                case 'week':
                    startDate.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    startDate.setMonth(now.getMonth() - 1);
                    break;
                case 'year':
                    startDate.setFullYear(now.getFullYear() - 1);
                    break;
            }
            // Get statistics in parallel
            const [totalBookings, completedBookings, pendingBookings, totalRevenue, recentBookings, upcomingBookings, userStats, paymentStats] = await Promise.all([
                // Total bookings count
                supabase.from('bookings').select('*', { count: 'exact', head: true }),
                // Completed bookings (this period)
                supabase.from('bookings')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'completed')
                    .gte('created_at', startDate.toISOString()),
                // Pending bookings
                supabase.from('bookings')
                    .select('*', { count: 'exact', head: true })
                    .in('status', ['pending', 'paid']),
                // Total revenue (successful payments)
                supabase.from('payments')
                    .select('amount')
                    .eq('status', 'success')
                    .gte('paid_at', startDate.toISOString()),
                // Recent bookings (last 10)
                supabase.from('bookings')
                    .select(`
            *,
            service:services(name, price),
            user:users!bookings_user_id_fkey(name, email, phone),
            payments(status, amount)
          `)
                    .order('created_at', { ascending: false })
                    .limit(10),
                // Upcoming bookings (next 7 days)
                supabase.from('bookings')
                    .select(`
            *,
            service:services(name),
            user:users!bookings_user_id_fkey(name, email, phone)
          `)
                    .gte('date', now.toISOString().split('T')[0])
                    .lte('date', new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
                    .in('status', ['paid', 'confirmed'])
                    .order('date', { ascending: true })
                    .order('start_time', { ascending: true })
                    .limit(10),
                // User statistics
                supabase.from('users')
                    .select('*', { count: 'exact', head: true }),
                // Payment statistics
                supabase.from('payments')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'success')
            ]);
            // Calculate revenue with type safety
            const revenue = totalRevenue.data?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
            // Get booking trend (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const { data: bookingTrend } = await supabase
                .from('bookings')
                .select('created_at, status')
                .gte('created_at', thirtyDaysAgo.toISOString());
            // Process trend data
            const trendData = AdminController.processTrendData(bookingTrend || [], period);
            // Fix: Add null checks for counts
            const totalBookingsCount = totalBookings.count || 0;
            const completedBookingsCount = completedBookings.count || 0;
            const pendingBookingsCount = pendingBookings.count || 0;
            const userStatsCount = userStats.count || 0;
            const paymentStatsCount = paymentStats.count || 0;
            return c.json({
                stats: {
                    overview: {
                        total_bookings: totalBookingsCount,
                        completed_bookings: completedBookingsCount,
                        pending_bookings: pendingBookingsCount,
                        total_revenue: revenue,
                        total_users: userStatsCount,
                        total_payments: paymentStatsCount,
                        conversion_rate: totalBookingsCount > 0
                            ? ((completedBookingsCount) / totalBookingsCount * 100).toFixed(1)
                            : '0',
                    },
                    recent_bookings: recentBookings.data || [],
                    upcoming_bookings: upcomingBookings.data || [],
                    trend: trendData,
                    period,
                },
            });
        }
        catch (error) {
            console.error('Get dashboard stats error:', error);
            return c.json({ error: 'Failed to fetch dashboard stats' }, 500);
        }
    }
    static processTrendData(bookings, period) {
        const trendMap = new Map();
        bookings.forEach(booking => {
            const date = new Date(booking.created_at);
            let key = '';
            switch (period) {
                case 'day':
                    key = `${date.getHours()}:00`;
                    break;
                case 'week':
                    key = date.toLocaleDateString('en-US', { weekday: 'short' });
                    break;
                case 'month':
                    key = `${date.getDate()}/${date.getMonth() + 1}`;
                    break;
                case 'year':
                    key = date.toLocaleDateString('en-US', { month: 'short' });
                    break;
            }
            if (!trendMap.has(key)) {
                trendMap.set(key, { bookings: 0, completed: 0 });
            }
            const data = trendMap.get(key);
            data.bookings++;
            if (booking.status === 'completed') {
                data.completed++;
            }
            trendMap.set(key, data);
        });
        return Array.from(trendMap.entries()).map(([label, data]) => ({
            label,
            bookings: data.bookings,
            completed: data.completed,
            completion_rate: data.bookings > 0 ? ((data.completed / data.bookings) * 100).toFixed(1) : '0'
        }));
    }
    // ==================== SERVICES MANAGEMENT ====================
    static async createService(c) {
        try {
            const user = c.get('user');
            if (user.role !== 'admin') {
                return c.json({ error: 'Admin access required' }, 403);
            }
            const body = await c.req.json();
            const { crops, ...serviceData } = serviceSchema.parse(body);
            const { data: service, error } = await supabase
                .from('services')
                .insert(serviceData)
                .select()
                .single();
            if (error)
                throw error;
            // Handle linked crops
            if (crops && crops.length > 0) {
                const cropLinks = crops.map(crop_id => ({
                    service_id: service.id,
                    crop_id
                }));
                const { error: linkError } = await supabase
                    .from('service_crops')
                    .insert(cropLinks);
                if (linkError) {
                    console.error('Link crops error:', linkError);
                    // Don't fail the whole thing, but maybe log it
                }
            }
            // Fetch complete service with relations
            const { data: fullService } = await supabase
                .from('services')
                .select(`
          *,
          featured_media:media_library(*),
          service_crops:crops(*)
        `)
                .eq('id', service.id)
                .single();
            return c.json({ service: fullService }, 201);
        }
        catch (error) {
            console.error('Create service error:', error);
            return c.json({ error: 'Failed to create service' }, 400);
        }
    }
    static async updateService(c) {
        try {
            const user = c.get('user');
            if (user.role !== 'admin') {
                return c.json({ error: 'Admin access required' }, 403);
            }
            const id = c.req.param('id');
            const body = await c.req.json();
            const { crops, ...serviceData } = serviceSchema.partial().parse(body);
            const { data: service, error } = await supabase
                .from('services')
                .update(serviceData)
                .eq('id', id)
                .select()
                .single();
            if (error)
                throw error;
            if (!service) {
                return c.json({ error: 'Service not found' }, 404);
            }
            // Sync linked crops if provided
            if (crops !== undefined) {
                // Delete old links
                await supabase
                    .from('service_crops')
                    .delete()
                    .eq('service_id', id);
                // Add new links
                if (crops.length > 0) {
                    const cropLinks = crops.map(crop_id => ({
                        service_id: id,
                        crop_id
                    }));
                    await supabase
                        .from('service_crops')
                        .insert(cropLinks);
                }
            }
            // Fetch updated service with relations
            const { data: fullService } = await supabase
                .from('services')
                .select(`
          *,
          featured_media:media_library(*),
          service_crops:crops(*)
        `)
                .eq('id', id)
                .single();
            return c.json({ service: fullService });
        }
        catch (error) {
            console.error('Update service error:', error);
            return c.json({ error: 'Failed to update service' }, 400);
        }
    }
    static async deleteService(c) {
        try {
            const user = c.get('user');
            if (user.role !== 'admin') {
                return c.json({ error: 'Admin access required' }, 403);
            }
            const id = c.req.param('id');
            // Get service info for media cleanup
            const { data: service } = await supabase
                .from('services')
                .select('featured_media_id')
                .eq('id', id)
                .single();
            // Check if service has bookings
            const { data: bookings, error: bookingsError } = await supabase
                .from('bookings')
                .select('id')
                .eq('service_id', id)
                .in('status', ['pending', 'paid', 'confirmed']);
            if (bookingsError)
                throw bookingsError;
            if (bookings && bookings.length > 0) {
                return c.json({
                    error: `Cannot delete service. It has ${bookings.length} active booking(s). Please cancel or reassign them first.`,
                    active_bookings: bookings.length
                }, 400);
            }
            // Delete linked crops first
            await supabase
                .from('service_crops')
                .delete()
                .eq('service_id', id);
            const { error } = await supabase
                .from('services')
                .delete()
                .eq('id', id);
            if (error)
                throw error;
            // Cleanup media if requested and exists
            if (service?.featured_media_id) {
                await AdminController.deleteMediaInternal(service.featured_media_id);
            }
            return c.json({
                message: 'Service deleted successfully',
                deleted_id: id
            });
        }
        catch (error) {
            console.error('Delete service error:', error);
            return c.json({ error: 'Failed to delete service. It may be linked to other resources.' }, 500);
        }
    }
    static async linkCropToService(c) {
        try {
            const user = c.get('user');
            if (user.role !== 'admin') {
                return c.json({ error: 'Admin access required' }, 403);
            }
            const { service_id, crop_id } = await c.req.json();
            // Check if link already exists
            const { data: existingLink } = await supabase
                .from('service_crops')
                .select('*')
                .eq('service_id', service_id)
                .eq('crop_id', crop_id)
                .single();
            if (existingLink) {
                return c.json({
                    message: 'Crop already linked to service',
                    link: existingLink
                });
            }
            const { data: link, error } = await supabase
                .from('service_crops')
                .insert({ service_id, crop_id })
                .select()
                .single();
            if (error)
                throw error;
            return c.json({
                message: 'Crop linked to service successfully',
                link
            });
        }
        catch (error) {
            console.error('Link crop error:', error);
            return c.json({ error: 'Failed to link crop' }, 400);
        }
    }
    static async unlinkCropFromService(c) {
        try {
            const user = c.get('user');
            if (user.role !== 'admin') {
                return c.json({ error: 'Admin access required' }, 403);
            }
            const { service_id, crop_id } = c.req.query();
            const { error } = await supabase
                .from('service_crops')
                .delete()
                .eq('service_id', service_id)
                .eq('crop_id', crop_id);
            if (error)
                throw error;
            return c.json({
                message: 'Crop unlinked from service successfully'
            });
        }
        catch (error) {
            console.error('Unlink crop error:', error);
            return c.json({ error: 'Failed to unlink crop' }, 400);
        }
    }
    // ==================== CROPS MANAGEMENT ====================
    static async createCrop(c) {
        try {
            const user = c.get('user');
            if (user.role !== 'admin') {
                return c.json({ error: 'Admin access required' }, 403);
            }
            const body = await c.req.json();
            const validated = cropSchema.parse(body);
            const { media_ids, ...cropData } = validated;
            const { data: crop, error } = await supabase
                .from('crops')
                .insert(cropData)
                .select(`
          *,
          featured_media:media_library(*),
          service_crops:services(*)
        `)
                .single();
            if (error)
                throw error;
            // Handle extra media if provided
            if (media_ids && media_ids.length > 0) {
                const cropMediaRecords = media_ids.map((media_id, index) => ({
                    crop_id: crop.id,
                    media_id,
                    display_order: index
                }));
                const { error: mediaError } = await supabase
                    .from('crop_media')
                    .insert(cropMediaRecords);
                if (mediaError) {
                    console.error('Error linking additional media to crop:', mediaError);
                }
            }
            // Re-fetch to include linked media
            const { data: updatedCrop } = await supabase
                .from('crops')
                .select(`
          *,
          featured_media:media_library(*),
          service_crops:services(*),
          crop_media:crop_media(
            id,
            display_order,
            media:media_library(*)
          )
        `)
                .eq('id', crop.id)
                .single();
            return c.json({ crop: updatedCrop || crop }, 201);
        }
        catch (error) {
            console.error('Create crop error:', error);
            return c.json({ error: 'Failed to create crop' }, 400);
        }
    }
    static async updateCrop(c) {
        try {
            const user = c.get('user');
            if (user.role !== 'admin') {
                return c.json({ error: 'Admin access required' }, 403);
            }
            const id = c.req.param('id');
            const body = await c.req.json();
            const validated = cropSchema.partial().parse(body);
            const { media_ids, ...cropData } = validated;
            const { data: crop, error } = await supabase
                .from('crops')
                .update(cropData)
                .eq('id', id)
                .select(`
          *,
          featured_media:media_library(*),
          service_crops:services(*)
        `)
                .single();
            if (error)
                throw error;
            if (!crop) {
                return c.json({ error: 'Crop not found' }, 404);
            }
            // Handle extra media if provided
            if (media_ids !== undefined) {
                // Delete existing links
                await supabase
                    .from('crop_media')
                    .delete()
                    .eq('crop_id', id);
                if (media_ids.length > 0) {
                    const cropMediaRecords = media_ids.map((media_id, index) => ({
                        crop_id: id,
                        media_id,
                        display_order: index
                    }));
                    const { error: mediaError } = await supabase
                        .from('crop_media')
                        .insert(cropMediaRecords);
                    if (mediaError) {
                        console.error('Error updating additional media for crop:', mediaError);
                    }
                }
            }
            // Re-fetch to include linked media
            const { data: updatedCrop } = await supabase
                .from('crops')
                .select(`
          *,
          featured_media:media_library(*),
          service_crops:services(*),
          crop_media:crop_media(
            id,
            display_order,
            media:media_library(*)
          )
        `)
                .eq('id', id)
                .single();
            return c.json({ crop: updatedCrop || crop });
        }
        catch (error) {
            console.error('Update crop error:', error);
            return c.json({ error: 'Failed to update crop' }, 400);
        }
    }
    static async deleteCrop(c) {
        try {
            const user = c.get('user');
            if (user.role !== 'admin') {
                return c.json({ error: 'Admin access required' }, 403);
            }
            const id = c.req.param('id');
            // Get crop info for media cleanup
            const { data: crop } = await supabase
                .from('crops')
                .select('featured_media_id')
                .eq('id', id)
                .single();
            // Check if crop is linked to services
            const { data: serviceLinks } = await supabase
                .from('service_crops')
                .select('service_id')
                .eq('crop_id', id);
            if (serviceLinks && serviceLinks.length > 0) {
                return c.json({
                    error: 'Cannot delete crop linked to services',
                    linked_services: serviceLinks.length
                }, 400);
            }
            // Delete linked media records
            await supabase
                .from('crop_media')
                .delete()
                .eq('crop_id', id);
            const { error } = await supabase
                .from('crops')
                .delete()
                .eq('id', id);
            if (error)
                throw error;
            // Cleanup featured media
            if (crop?.featured_media_id) {
                await AdminController.deleteMediaInternal(crop.featured_media_id);
            }
            return c.json({
                message: 'Crop deleted successfully',
                deleted_id: id
            });
        }
        catch (error) {
            console.error('Delete crop error:', error);
            return c.json({ error: 'Failed to delete crop' }, 500);
        }
    }
    // ==================== PROJECTS MANAGEMENT ====================
    static async createProject(c) {
        try {
            const user = c.get('user');
            if (user.role !== 'admin') {
                return c.json({ error: 'Admin access required' }, 403);
            }
            // Handle direct file upload if present
            const uploadedMediaId = await AdminController.uploadFileInternal(c, 'project');
            let body = await c.req.parseBody();
            // If it's JSON, parseBody might work or not depending on context. 
            // But uploadMiddleware should have handled its part.
            // If body is empty or doesn't have name, try json()
            if (!body.name) {
                try {
                    body = await c.req.json();
                }
                catch (e) { }
            }
            const validated = projectSchema.parse(body);
            const { media_ids, ...projectData } = validated;
            if (uploadedMediaId) {
                projectData.featured_media_id = uploadedMediaId;
            }
            const { data: project, error } = await supabase
                .from('projects')
                .insert(projectData)
                .select(`
          *,
          featured_media:media_library(*),
          project_media:project_media(
            media:media_library(*)
          )
        `)
                .single();
            if (error)
                throw error;
            // Handle extra media if provided
            if (media_ids && media_ids.length > 0) {
                const projectMediaRecords = media_ids.map((media_id, index) => ({
                    project_id: project.id,
                    media_id,
                    display_order: index
                }));
                const { error: mediaError } = await supabase
                    .from('project_media')
                    .insert(projectMediaRecords);
                if (mediaError) {
                    console.error('Error linking additional media to project:', mediaError);
                }
            }
            // Re-fetch to include linked media
            const { data: updatedProject } = await supabase
                .from('projects')
                .select(`
          *,
          featured_media:media_library(*),
          project_media:project_media(
            id,
            display_order,
            media:media_library(*)
          )
        `)
                .eq('id', project.id)
                .single();
            return c.json({ project: updatedProject || project }, 201);
        }
        catch (error) {
            console.error('Create project error:', error);
            return c.json({ error: 'Failed to create project' }, 400);
        }
    }
    static async updateProject(c) {
        try {
            const user = c.get('user');
            if (user.role !== 'admin') {
                return c.json({ error: 'Admin access required' }, 403);
            }
            const id = c.req.param('id');
            // Handle direct file upload if present
            const uploadedMediaId = await AdminController.uploadFileInternal(c, 'project');
            let body = await c.req.parseBody();
            if (!body.name && !body.description && !body.status) {
                try {
                    body = await c.req.json();
                }
                catch (e) { }
            }
            const validated = projectSchema.partial().parse(body);
            const { media_ids, ...projectData } = validated;
            if (uploadedMediaId) {
                projectData.featured_media_id = uploadedMediaId;
            }
            const { data: project, error } = await supabase
                .from('projects')
                .update(projectData)
                .eq('id', id)
                .select(`
          *,
          featured_media:media_library(*),
          project_media:project_media(
            media:media_library(*)
          )
        `)
                .single();
            if (error)
                throw error;
            if (!project) {
                return c.json({ error: 'Project not found' }, 404);
            }
            // Handle extra media if provided
            if (media_ids !== undefined) {
                // Delete existing links
                await supabase
                    .from('project_media')
                    .delete()
                    .eq('project_id', id);
                if (media_ids.length > 0) {
                    const projectMediaRecords = media_ids.map((media_id, index) => ({
                        project_id: id,
                        media_id,
                        display_order: index
                    }));
                    const { error: mediaError } = await supabase
                        .from('project_media')
                        .insert(projectMediaRecords);
                    if (mediaError) {
                        console.error('Error updating additional media for project:', mediaError);
                    }
                }
            }
            // Re-fetch to include linked media
            const { data: updatedProject } = await supabase
                .from('projects')
                .select(`
          *,
          featured_media:media_library(*),
          project_media:project_media(
            id,
            display_order,
            media:media_library(*)
          )
        `)
                .eq('id', id)
                .single();
            return c.json({ project: updatedProject || project });
        }
        catch (error) {
            console.error('Update project error:', error);
            return c.json({ error: 'Failed to update project' }, 400);
        }
    }
    static async deleteProject(c) {
        try {
            const user = c.get('user');
            if (user.role !== 'admin') {
                return c.json({ error: 'Admin access required' }, 403);
            }
            const id = c.req.param('id');
            // Get project info for media cleanup
            const { data: project } = await supabase
                .from('projects')
                .select('featured_media_id')
                .eq('id', id)
                .single();
            // Delete project media associations first
            await supabase
                .from('project_media')
                .delete()
                .eq('project_id', id);
            // Delete project
            const { error } = await supabase
                .from('projects')
                .delete()
                .eq('id', id);
            if (error)
                throw error;
            // Cleanup featured media
            if (project?.featured_media_id) {
                await AdminController.deleteMediaInternal(project.featured_media_id);
            }
            return c.json({
                message: 'Project deleted successfully',
                deleted_id: id
            });
        }
        catch (error) {
            console.error('Delete project error:', error);
            return c.json({ error: 'Failed to delete project' }, 500);
        }
    }
    static async addProjectMedia(c) {
        try {
            const user = c.get('user');
            if (user.role !== 'admin') {
                return c.json({ error: 'Admin access required' }, 403);
            }
            const projectId = c.req.param('id');
            const { media_id, caption, display_order } = await c.req.json();
            const { data: projectMedia, error } = await supabase
                .from('project_media')
                .insert({
                project_id: projectId,
                media_id,
                caption,
                display_order: display_order || 0
            })
                .select(`
          *,
          media:media_library(*)
        `)
                .single();
            if (error)
                throw error;
            return c.json({ project_media: projectMedia }, 201);
        }
        catch (error) {
            console.error('Add project media error:', error);
            return c.json({ error: 'Failed to add media to project' }, 400);
        }
    }
    static async removeProjectMedia(c) {
        try {
            const user = c.get('user');
            if (user.role !== 'admin') {
                return c.json({ error: 'Admin access required' }, 403);
            }
            const id = c.req.param('mediaId');
            const { error } = await supabase
                .from('project_media')
                .delete()
                .eq('id', id);
            if (error)
                throw error;
            return c.json({
                message: 'Media removed from project successfully'
            });
        }
        catch (error) {
            console.error('Remove project media error:', error);
            return c.json({ error: 'Failed to remove media from project' }, 400);
        }
    }
    // ==================== TESTIMONIALS MANAGEMENT ====================
    static async createTestimonial(c) {
        try {
            const user = c.get('user');
            const body = await c.req.json();
            const validated = testimonialSchema.parse(body);
            const { data: testimonial, error } = await supabase
                .from('testimonials')
                .insert({
                ...validated,
                ...(user.role === 'client' && { user_id: user.userId }),
            })
                .select(`
          *,
          project:projects(name),
          user_media:media_library(*)
        `)
                .single();
            if (error)
                throw error;
            return c.json({ testimonial }, 201);
        }
        catch (error) {
            console.error('Create testimonial error:', error);
            return c.json({ error: 'Failed to create testimonial' }, 400);
        }
    }
    static async updateTestimonial(c) {
        try {
            const user = c.get('user');
            const id = c.req.param('id');
            const body = await c.req.json();
            const validated = testimonialSchema.partial().parse(body);
            // Check if testimonial exists and user has permission
            const { data: existingTestimonial, error: fetchError } = await supabase
                .from('testimonials')
                .select('*')
                .eq('id', id)
                .single();
            if (fetchError || !existingTestimonial) {
                return c.json({ error: 'Testimonial not found' }, 404);
            }
            // Only admin or original poster can update
            if (user.role !== 'admin' && existingTestimonial.user_id !== user.userId) {
                return c.json({ error: 'Unauthorized' }, 403);
            }
            const { data: testimonial, error } = await supabase
                .from('testimonials')
                .update(validated)
                .eq('id', id)
                .select(`
          *,
          project:projects(name),
          user_media:media_library(*)
        `)
                .single();
            if (error)
                throw error;
            return c.json({ testimonial });
        }
        catch (error) {
            console.error('Update testimonial error:', error);
            return c.json({ error: 'Failed to update testimonial' }, 400);
        }
    }
    static async deleteTestimonial(c) {
        try {
            const user = c.get('user');
            const id = c.req.param('id');
            if (user.role !== 'admin') {
                return c.json({ error: 'Admin access required' }, 403);
            }
            const { error } = await supabase
                .from('testimonials')
                .delete()
                .eq('id', id);
            if (error)
                throw error;
            return c.json({
                message: 'Testimonial deleted successfully',
                deleted_id: id
            });
        }
        catch (error) {
            console.error('Delete testimonial error:', error);
            return c.json({ error: 'Failed to delete testimonial' }, 500);
        }
    }
    static async approveTestimonial(c) {
        try {
            const user = c.get('user');
            if (user.role !== 'admin') {
                return c.json({ error: 'Admin access required' }, 403);
            }
            const id = c.req.param('id');
            const { data: testimonial, error } = await supabase
                .from('testimonials')
                .update({
                rating: 5, // Default approved rating
                updated_at: new Date().toISOString()
            })
                .eq('id', id)
                .select()
                .single();
            if (error)
                throw error;
            if (!testimonial) {
                return c.json({ error: 'Testimonial not found' }, 404);
            }
            return c.json({
                message: 'Testimonial approved',
                testimonial
            });
        }
        catch (error) {
            console.error('Approve testimonial error:', error);
            return c.json({ error: 'Failed to approve testimonial' }, 400);
        }
    }
    // ==================== TIPS/BLOG MANAGEMENT ====================
    static async createTip(c) {
        try {
            const user = c.get('user');
            if (user.role !== 'admin') {
                return c.json({ error: 'Admin access required' }, 403);
            }
            const body = await c.req.json();
            const validated = tipSchema.parse(body);
            const { data: tip, error } = await supabase
                .from('tips')
                .insert({
                ...validated,
                author_id: user.userId,
                published_at: validated.status === 'published' ? new Date().toISOString() : null,
            })
                .select(`
          *,
          featured_media:media_library(*),
          author:users(name),
          tip_media:tip_media(
            media:media_library(*)
          )
        `)
                .single();
            if (error)
                throw error;
            return c.json({ tip }, 201);
        }
        catch (error) {
            console.error('Create tip error:', error);
            return c.json({ error: 'Failed to create tip' }, 400);
        }
    }
    static async updateTip(c) {
        try {
            const user = c.get('user');
            if (user.role !== 'admin') {
                return c.json({ error: 'Admin access required' }, 403);
            }
            const id = c.req.param('id');
            const body = await c.req.json();
            const validated = tipSchema.partial().parse(body);
            const updateData = { ...validated };
            if (validated.status === 'published' && !validated.published_at) {
                updateData.published_at = new Date().toISOString();
            }
            else if (validated.status === 'draft') {
                updateData.published_at = null;
            }
            const { data: tip, error } = await supabase
                .from('tips')
                .update(updateData)
                .eq('id', id)
                .select(`
          *,
          featured_media:media_library(*),
          author:users(name),
          tip_media:tip_media(
            media:media_library(*)
          )
        `)
                .single();
            if (error)
                throw error;
            if (!tip) {
                return c.json({ error: 'Tip not found' }, 404);
            }
            return c.json({ tip });
        }
        catch (error) {
            console.error('Update tip error:', error);
            return c.json({ error: 'Failed to update tip' }, 400);
        }
    }
    static async deleteTip(c) {
        try {
            const user = c.get('user');
            if (user.role !== 'admin') {
                return c.json({ error: 'Admin access required' }, 403);
            }
            const id = c.req.param('id');
            // Get tip info for media cleanup
            const { data: tip } = await supabase
                .from('tips')
                .select('featured_media_id')
                .eq('id', id)
                .single();
            // Delete tip media associations first
            await supabase
                .from('tip_media')
                .delete()
                .eq('tip_id', id);
            // Delete tip
            const { error } = await supabase
                .from('tips')
                .delete()
                .eq('id', id);
            if (error)
                throw error;
            // Cleanup featured media
            if (tip?.featured_media_id) {
                await AdminController.deleteMediaInternal(tip.featured_media_id);
            }
            return c.json({
                message: 'Tip deleted successfully',
                deleted_id: id
            });
        }
        catch (error) {
            console.error('Delete tip error:', error);
            return c.json({ error: 'Failed to delete tip' }, 500);
        }
    }
    static async addTipMedia(c) {
        try {
            const user = c.get('user');
            if (user.role !== 'admin') {
                return c.json({ error: 'Admin access required' }, 403);
            }
            const tipId = c.req.param('id');
            const { media_id, caption, display_order } = await c.req.json();
            const { data: tipMedia, error } = await supabase
                .from('tip_media')
                .insert({
                tip_id: tipId,
                media_id,
                caption,
                display_order: display_order || 0
            })
                .select(`
          *,
          media:media_library(*)
        `)
                .single();
            if (error)
                throw error;
            return c.json({ tip_media: tipMedia }, 201);
        }
        catch (error) {
            console.error('Add tip media error:', error);
            return c.json({ error: 'Failed to add media to tip' }, 400);
        }
    }
    // ==================== BOOKINGS MANAGEMENT ====================
    static async getAllBookings(c) {
        try {
            const user = c.get('user');
            if (user.role !== 'admin') {
                return c.json({ error: 'Admin access required' }, 403);
            }
            const { status, date_from, date_to, user_id, service_id, limit = '50', offset = '0' } = c.req.query();
            // Fix: Convert string parameters to numbers
            const limitNum = parseInt(limit, 10);
            const offsetNum = parseInt(offset, 10);
            if (isNaN(limitNum) || isNaN(offsetNum)) {
                return c.json({ error: 'Invalid limit or offset parameter' }, 400);
            }
            let query = supabase
                .from('bookings')
                .select(`
          *,
          service:services(*),
          user:users!bookings_user_id_fkey(name, email, phone),
          payments(*)
        `, { count: 'exact' })
                .order('date', { ascending: false })
                .order('start_time', { ascending: false })
                .range(offsetNum, offsetNum + limitNum - 1);
            if (status) {
                query = query.eq('status', status);
            }
            if (date_from) {
                query = query.gte('date', date_from);
            }
            if (date_to) {
                query = query.lte('date', date_to);
            }
            if (user_id) {
                query = query.eq('user_id', user_id);
            }
            if (service_id) {
                query = query.eq('service_id', service_id);
            }
            const { data: bookings, error, count } = await query;
            if (error)
                throw error;
            return c.json({
                bookings: bookings || [],
                meta: { total: count || 0, limit: limitNum, offset: offsetNum }
            });
        }
        catch (error) {
            console.error('Get all bookings error:', error);
            return c.json({ error: 'Failed to fetch bookings' }, 500);
        }
    }
    static async updateBooking(c) {
        try {
            const user = c.get('user');
            if (user.role !== 'admin') {
                return c.json({ error: 'Admin access required' }, 403);
            }
            const id = c.req.param('id');
            const { status, meeting_link, date, start_time, end_time } = await c.req.json();
            const updateData = {};
            if (status)
                updateData.status = status;
            if (meeting_link)
                updateData.meeting_link = meeting_link;
            if (date)
                updateData.date = date;
            if (start_time)
                updateData.start_time = start_time;
            if (end_time)
                updateData.end_time = end_time;
            const { data: booking, error } = await supabase
                .from('bookings')
                .update(updateData)
                .eq('id', id)
                .select(`
          *,
          service:services(*),
          user:users!bookings_user_id_fkey(*)
        `)
                .single();
            if (error)
                throw error;
            if (!booking) {
                return c.json({ error: 'Booking not found' }, 404);
            }
            // Create notification for user
            if (status || meeting_link) {
                await supabase
                    .from('notifications')
                    .insert({
                    user_id: booking.user_id,
                    type: 'booking_confirmation',
                    message: status
                        ? `Your booking status has been updated to ${status}`
                        : 'Meeting link has been added to your booking',
                });
            }
            return c.json({ booking });
        }
        catch (error) {
            console.error('Update booking error:', error);
            return c.json({ error: 'Failed to update booking' }, 400);
        }
    }
    static async cancelBookingAdmin(c) {
        try {
            const user = c.get('user');
            if (user.role !== 'admin') {
                return c.json({ error: 'Admin access required' }, 403);
            }
            const id = c.req.param('id');
            const { reason } = await c.req.json();
            const { data: booking, error } = await supabase
                .from('bookings')
                .update({
                status: 'cancelled',
                updated_at: new Date().toISOString()
            })
                .eq('id', id)
                .select(`
          *,
          service:services(*),
          user:users!bookings_user_id_fkey(*)
        `)
                .single();
            if (error)
                throw error;
            if (!booking) {
                return c.json({ error: 'Booking not found' }, 404);
            }
            // Create notification
            await supabase
                .from('notifications')
                .insert({
                user_id: booking.user_id,
                type: 'booking_confirmation',
                message: `Your booking has been cancelled${reason ? `: ${reason}` : ''}`,
            });
            // Refund payment if exists
            const { data: payment } = await supabase
                .from('payments')
                .select('*')
                .eq('booking_id', id)
                .eq('status', 'success')
                .single();
            if (payment) {
                // Here you would initiate refund through Daraja API
                await supabase
                    .from('payments')
                    .update({ status: 'refunded' })
                    .eq('id', payment.id);
            }
            return c.json({
                message: 'Booking cancelled successfully',
                booking,
                refund_initiated: !!payment
            });
        }
        catch (error) {
            console.error('Cancel booking error:', error);
            return c.json({ error: 'Failed to cancel booking' }, 400);
        }
    }
    // ==================== USERS MANAGEMENT ====================
    static async getAllUsers(c) {
        try {
            const user = c.get('user');
            if (user.role !== 'admin') {
                return c.json({ error: 'Admin access required' }, 403);
            }
            const { role, limit = '50', offset = '0' } = c.req.query();
            // Fix: Convert string parameters to numbers
            const limitNum = parseInt(limit, 10);
            const offsetNum = parseInt(offset, 10);
            if (isNaN(limitNum) || isNaN(offsetNum)) {
                return c.json({ error: 'Invalid limit or offset parameter' }, 400);
            }
            let query = supabase
                .from('users')
                .select(`
          id,
          name,
          email,
          phone,
          role,
          profile_media:media_library!users_profile_media_id_fkey(*),
          created_at,
          updated_at
        `, { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(offsetNum, offsetNum + limitNum - 1);
            if (role) {
                query = query.eq('role', role);
            }
            const { data: users, error, count } = await query;
            if (error)
                throw error;
            return c.json({
                users: users || [],
                meta: { total: count || 0, limit: limitNum, offset: offsetNum }
            });
        }
        catch (error) {
            console.error('Get all users error:', error);
            return c.json({ error: 'Failed to fetch users' }, 500);
        }
    }
    static async getUserDetails(c) {
        try {
            const user = c.get('user');
            if (user.role !== 'admin') {
                return c.json({ error: 'Admin access required' }, 403);
            }
            const id = c.req.param('id');
            const { data: userData, error } = await supabase
                .from('users')
                .select(`
          *,
          profile_media:media_library(*),
          bookings:bookings(
            *,
            service:services(*),
            payments(*)
          )
        `)
                .eq('id', id)
                .single();
            if (error || !userData) {
                return c.json({ error: 'User not found' }, 404);
            }
            // Remove sensitive data
            const { password_hash, ...safeUser } = userData;
            return c.json({ user: safeUser });
        }
        catch (error) {
            console.error('Get user details error:', error);
            return c.json({ error: 'Failed to fetch user details' }, 500);
        }
    }
    static async updateUserRole(c) {
        try {
            const user = c.get('user');
            if (user.role !== 'admin') {
                return c.json({ error: 'Admin access required' }, 403);
            }
            const id = c.req.param('id');
            const { role } = await c.req.json();
            if (!['admin', 'client'].includes(role)) {
                return c.json({ error: 'Invalid role' }, 400);
            }
            const { data: userData, error } = await supabase
                .from('users')
                .update({ role })
                .eq('id', id)
                .select()
                .single();
            if (error)
                throw error;
            if (!userData) {
                return c.json({ error: 'User not found' }, 404);
            }
            return c.json({
                message: 'User role updated successfully',
                user: userData
            });
        }
        catch (error) {
            console.error('Update user role error:', error);
            return c.json({ error: 'Failed to update user role' }, 400);
        }
    }
    static async deleteUser(c) {
        try {
            const user = c.get('user');
            if (user.role !== 'admin') {
                return c.json({ error: 'Admin access required' }, 403);
            }
            const id = c.req.param('id');
            // Prevent deleting self
            if (id === user.userId) {
                return c.json({ error: 'Cannot delete your own account' }, 400);
            }
            // Check if user has bookings
            const { data: bookings } = await supabase
                .from('bookings')
                .select('id')
                .eq('user_id', id);
            if (bookings && bookings.length > 0) {
                return c.json({
                    error: 'Cannot delete user with existing bookings',
                    active_bookings: bookings.length
                }, 400);
            }
            // Check if user authored any tips
            const { data: tips } = await supabase
                .from('tips')
                .select('id')
                .eq('author_id', id);
            if (tips && tips.length > 0) {
                return c.json({
                    error: 'Cannot delete user who has authored tips. Please reassign or delete their content first.',
                    authored_tips: tips.length
                }, 400);
            }
            // Check if user uploaded media (optional: or just let database CASCADE if configured, but better to be safe)
            // For now, let's assume we want to prevent orphan media or complicated cascades
            const { data: media } = await supabase
                .from('media_library')
                .select('id')
                .eq('uploaded_by', id);
            if (media && media.length > 0) {
                // Option: Cascade delete? Or block? 
                // Let's block for safety as requested in plan
                return c.json({
                    error: 'Cannot delete user who has uploaded media files. Please clean up their media library first.',
                    uploaded_media: media.length
                }, 400);
            }
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', id);
            if (error)
                throw error;
            return c.json({
                message: 'User deleted successfully',
                deleted_id: id
            });
        }
        catch (error) {
            console.error('Delete user error:', error);
            return c.json({ error: 'Failed to delete user' }, 500);
        }
    }
    // ==================== AVAILABILITY MANAGEMENT ====================
    static async setAvailability(c) {
        try {
            const user = c.get('user');
            if (user.role !== 'admin') {
                return c.json({ error: 'Admin access required' }, 403);
            }
            const body = await c.req.json();
            const validated = availabilitySchema.parse(body);
            // You might want to create an availability table
            // For now, we'll store in a simple format
            const availability = {
                admin_id: user.userId,
                ...validated,
                created_at: new Date().toISOString()
            };
            // This is a simplified implementation
            // In production, you'd have a proper availability table
            return c.json({
                message: 'Availability set successfully',
                availability
            });
        }
        catch (error) {
            console.error('Set availability error:', error);
            return c.json({ error: 'Failed to set availability' }, 400);
        }
    }
    static async getAvailability(c) {
        try {
            const user = c.get('user');
            if (user.role !== 'admin') {
                return c.json({ error: 'Admin access required' }, 403);
            }
            const { date } = c.req.query();
            if (!date) {
                return c.json({ error: 'Date is required' }, 400);
            }
            // Get all bookings for the date
            const { data: bookings, error } = await supabase
                .from('bookings')
                .select('*')
                .eq('admin_id', user.userId)
                .eq('date', date)
                .in('status', ['pending', 'paid', 'confirmed']);
            if (error)
                throw error;
            // Generate available slots (9 AM to 5 PM, 30-minute intervals)
            const slots = [];
            const startHour = 9;
            const endHour = 17;
            const slotDuration = 30;
            for (let hour = startHour; hour < endHour; hour++) {
                for (let minute = 0; minute < 60; minute += slotDuration) {
                    const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                    // Check if slot is booked
                    const isBooked = bookings?.some(booking => booking.start_time <= time && booking.end_time > time);
                    slots.push({
                        time,
                        available: !isBooked,
                        booked_by: isBooked ? bookings?.find(b => b.start_time <= time && b.end_time > time)?.user_id : null
                    });
                }
            }
            return c.json({
                date,
                slots,
                total_slots: slots.length,
                available_slots: slots.filter(s => s.available).length,
                booked_slots: slots.filter(s => !s.available).length
            });
        }
        catch (error) {
            console.error('Get availability error:', error);
            return c.json({ error: 'Failed to get availability' }, 500);
        }
    }
    // ==================== SYSTEM SETTINGS ====================
    static async getSystemSettings(c) {
        try {
            const user = c.get('user');
            if (user.role !== 'admin') {
                return c.json({ error: 'Admin access required' }, 403);
            }
            // Get all settings from a settings table
            // For now, return default settings
            const settings = {
                platform: {
                    name: 'Agriculture Consultation Platform',
                    currency: 'KES',
                    timezone: 'Africa/Nairobi',
                    booking_window_days: 30,
                    cancellation_hours: 24,
                    max_bookings_per_day: 8
                },
                payments: {
                    mpesa_enabled: true,
                    stripe_enabled: false,
                    payment_required_for_booking: true
                },
                notifications: {
                    email_notifications: true,
                    sms_notifications: true,
                    whatsapp_notifications: false,
                    reminder_hours: [24, 1] // hours before booking
                },
                integrations: {
                    google_calendar: false,
                    zoom_integration: false
                }
            };
            return c.json({ settings });
        }
        catch (error) {
            console.error('Get system settings error:', error);
            return c.json({ error: 'Failed to get system settings' }, 500);
        }
    }
    static async updateSystemSettings(c) {
        try {
            const user = c.get('user');
            if (user.role !== 'admin') {
                return c.json({ error: 'Admin access required' }, 403);
            }
            const updates = await c.req.json();
            // You would update a settings table here
            // For now, just return the updates
            return c.json({
                message: 'Settings updated successfully',
                updates
            });
        }
        catch (error) {
            console.error('Update system settings error:', error);
            return c.json({ error: 'Failed to update system settings' }, 400);
        }
    }
    // ==================== EXPORT DATA ====================
    static async exportData(c) {
        try {
            const user = c.get('user');
            if (user.role !== 'admin') {
                return c.json({ error: 'Admin access required' }, 403);
            }
            const { type, start_date, end_date } = c.req.query();
            let data = [];
            switch (type) {
                case 'bookings':
                    let query = supabase
                        .from('bookings')
                        .select(`
              *,
              service:services(*),
              user:users!bookings_user_id_fkey(*),
              payments(*)
            `);
                    if (start_date)
                        query = query.gte('date', start_date);
                    if (end_date)
                        query = query.lte('date', end_date);
                    const { data: bookings } = await query;
                    data = bookings || [];
                    break;
                case 'payments':
                    const { data: payments } = await supabase
                        .from('payments')
                        .select(`
              *,
              booking:bookings(
                *,
                service:services(*),
                user:users(*)
              )
            `)
                        .gte('paid_at', start_date || '1970-01-01')
                        .lte('paid_at', end_date || new Date().toISOString());
                    data = payments || [];
                    break;
                case 'users':
                    const { data: users } = await supabase
                        .from('users')
                        .select('*')
                        .gte('created_at', start_date || '1970-01-01')
                        .lte('created_at', end_date || new Date().toISOString());
                    data = users?.map(user => {
                        const { password_hash, ...safeUser } = user;
                        return safeUser;
                    }) || [];
                    break;
                default:
                    return c.json({ error: 'Invalid export type' }, 400);
            }
            return c.json({
                exported: true,
                type,
                count: data.length || 0,
                date_range: { start_date, end_date },
                data
            });
        }
        catch (error) {
            console.error('Export data error:', error);
            return c.json({ error: 'Failed to export data' }, 500);
        }
    }
    // ==================== HELPERS ====================
    static async deleteMediaInternal(mediaId) {
        try {
            const { data: media, error: fetchError } = await supabase
                .from('media_library')
                .select('public_id')
                .eq('id', mediaId)
                .single();
            if (fetchError || !media)
                return;
            await CloudinaryService.deleteFile(media.public_id);
            await supabase.from('media_library').delete().eq('id', mediaId);
        }
        catch (error) {
            console.error('Delete media internal error:', error);
        }
    }
    static async uploadFileInternal(c, category) {
        try {
            const file = getUploadedFile(c);
            if (!file)
                return null;
            const user = c.get('user');
            const folder = getFolderForCategory(category);
            const resourceType = getResourceType(file.mimetype);
            const uploadResult = await CloudinaryService.uploadFile(file.buffer, {
                folder,
                resource_type: resourceType,
                tags: [category]
            });
            let mediaType = 'image';
            if (resourceType === 'video')
                mediaType = 'video';
            if (resourceType === 'raw')
                mediaType = 'document';
            const mimeType = CloudinaryService.getMimeTypeFromResourceType(uploadResult.resource_type, uploadResult.format);
            const { data: media, error } = await supabase
                .from('media_library')
                .insert({
                public_id: uploadResult.public_id,
                url: uploadResult.secure_url,
                type: mediaType,
                category,
                file_size: uploadResult.bytes,
                mime_type: mimeType,
                width: uploadResult.width,
                height: uploadResult.height,
                duration: uploadResult.duration,
                uploaded_by: user.userId,
            })
                .select()
                .single();
            if (error)
                throw error;
            return media.id;
        }
        catch (e) {
            console.error('Internal upload error:', e);
            return null;
        }
    }
}
//# sourceMappingURL=admin.js.map