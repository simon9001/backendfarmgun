import { supabase } from '../db/supabaseClient.js';
import { bookingSchema } from '../utils/validation.js';
export class BookingsController {
    static async getAvailableSlots(c) {
        try {
            const { date, service_id } = c.req.query();
            if (!date || !service_id) {
                return c.json({ error: 'Date and service_id are required' }, 400);
            }
            // Get service duration
            const { data: service, error: serviceError } = await supabase
                .from('services')
                .select('duration_mins')
                .eq('id', service_id)
                .single();
            if (serviceError || !service) {
                return c.json({ error: 'Service not found' }, 404);
            }
            // Get admin availability (assuming admin_id = 1 for now)
            const adminId = '1'; // In production, get from config or admin settings
            // Get existing bookings for the date
            const { data: existingBookings, error: bookingsError } = await supabase
                .from('bookings')
                .select('start_time, end_time, status')
                .eq('admin_id', adminId)
                .eq('date', date)
                .in('status', ['pending', 'paid', 'confirmed']);
            if (bookingsError)
                throw bookingsError;
            // Generate time slots (9 AM to 5 PM, 30-minute intervals)
            const slots = [];
            const startHour = 9;
            const endHour = 17;
            const slotDuration = 30; // minutes
            for (let hour = startHour; hour < endHour; hour++) {
                for (let minute = 0; minute < 60; minute += slotDuration) {
                    const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                    // Check if slot is available (not overlapping with existing bookings)
                    const isAvailable = !existingBookings?.some(booking => {
                        const bookingStart = booking.start_time;
                        const bookingEnd = booking.end_time;
                        const slotEnd = this.addMinutes(time, service.duration_mins);
                        return this.timeOverlap(time, slotEnd, bookingStart, bookingEnd);
                    });
                    slots.push({
                        time,
                        available: isAvailable,
                    });
                }
            }
            return c.json({ slots });
        }
        catch (error) {
            console.error('Get slots error:', error);
            return c.json({ error: 'Failed to get available slots' }, 500);
        }
    }
    static async createBooking(c) {
        try {
            const user = c.get('user');
            const body = await c.req.json();
            const validated = bookingSchema.parse(body);
            // Get service details
            const { data: service, error: serviceError } = await supabase
                .from('services')
                .select('duration_mins, price')
                .eq('id', validated.service_id)
                .single();
            if (serviceError || !service) {
                return c.json({ error: 'Service not found' }, 404);
            }
            // Calculate end time
            const endTime = this.addMinutes(validated.start_time, service.duration_mins);
            // Check for conflicts
            const adminId = '1'; // In production, get from config
            const { data: conflictingBooking, error: conflictError } = await supabase
                .from('bookings')
                .select('id')
                .eq('admin_id', adminId)
                .eq('date', validated.date)
                .or(`and(start_time.lte.${validated.start_time},end_time.gt.${validated.start_time}),and(start_time.lt.${endTime},end_time.gte.${endTime})`)
                .in('status', ['pending', 'paid', 'confirmed'])
                .maybeSingle();
            if (conflictError)
                throw conflictError;
            if (conflictingBooking) {
                return c.json({ error: 'Time slot is not available' }, 409);
            }
            // Create booking
            const { data: booking, error: bookingError } = await supabase
                .from('bookings')
                .insert({
                user_id: user.userId,
                admin_id: adminId,
                service_id: validated.service_id,
                date: validated.date,
                start_time: validated.start_time,
                end_time: endTime,
                status: 'pending',
            })
                .select(`
          *,
          service:services(*),
          user:users(name, email, phone)
        `)
                .single();
            if (bookingError)
                throw bookingError;
            // Create notification for admin
            await supabase
                .from('notifications')
                .insert({
                user_id: adminId,
                type: 'booking_confirmation',
                message: `New booking from ${user.userId} for ${validated.date} at ${validated.start_time}`,
            });
            return c.json({ booking }, 201);
        }
        catch (error) {
            console.error('Create booking error:', error);
            return c.json({ error: 'Failed to create booking' }, 400);
        }
    }
    static async getUserBookings(c) {
        try {
            const user = c.get('user');
            const { status, limit = '20', offset = '0' } = c.req.query();
            // Convert string parameters to numbers with validation
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
          payments(*)
        `)
                .eq('user_id', user.userId)
                .order('date', { ascending: false })
                .order('start_time', { ascending: false })
                .range(offsetNum, offsetNum + limitNum - 1);
            if (status) {
                query = query.eq('status', status);
            }
            const { data: bookings, error } = await query;
            if (error)
                throw error;
            return c.json({ bookings: bookings || [] });
        }
        catch (error) {
            console.error('Get bookings error:', error);
            return c.json({ error: 'Failed to fetch bookings' }, 500);
        }
    }
    static async getBookingById(c) {
        try {
            const user = c.get('user');
            const id = c.req.param('id');
            const { data: booking, error } = await supabase
                .from('bookings')
                .select(`
          *,
          service:services(*),
          payments(*),
          user:users(*)
        `)
                .eq('id', id)
                .maybeSingle();
            if (error)
                throw error;
            if (!booking) {
                return c.json({ error: 'Booking not found' }, 404);
            }
            // Check authorization
            if (booking.user_id !== user.userId && user.role !== 'admin') {
                return c.json({ error: 'Unauthorized' }, 403);
            }
            return c.json({ booking });
        }
        catch (error) {
            console.error('Get booking error:', error);
            return c.json({ error: 'Failed to fetch booking' }, 500);
        }
    }
    static async updateBookingStatus(c) {
        try {
            const user = c.get('user');
            if (user.role !== 'admin') {
                return c.json({ error: 'Admin access required' }, 403);
            }
            const id = c.req.param('id');
            const { status, meeting_link } = await c.req.json();
            const updateData = {};
            if (status)
                updateData.status = status;
            if (meeting_link)
                updateData.meeting_link = meeting_link;
            const { data: booking, error } = await supabase
                .from('bookings')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();
            if (error)
                throw error;
            if (!booking) {
                return c.json({ error: 'Booking not found' }, 404);
            }
            // Create notification for user
            await supabase
                .from('notifications')
                .insert({
                user_id: booking.user_id,
                type: 'booking_confirmation',
                message: `Your booking status has been updated to ${status}`,
            });
            return c.json({ booking });
        }
        catch (error) {
            console.error('Update booking error:', error);
            return c.json({ error: 'Failed to update booking' }, 400);
        }
    }
    static async cancelBooking(c) {
        try {
            const user = c.get('user');
            const id = c.req.param('id');
            const { data: booking, error: fetchError } = await supabase
                .from('bookings')
                .select('*')
                .eq('id', id)
                .single();
            if (fetchError || !booking) {
                return c.json({ error: 'Booking not found' }, 404);
            }
            // Check authorization
            if (booking.user_id !== user.userId && user.role !== 'admin') {
                return c.json({ error: 'Unauthorized' }, 403);
            }
            // Only allow cancellation if booking is not completed
            if (booking.status === 'completed') {
                return c.json({ error: 'Cannot cancel completed booking' }, 400);
            }
            const { data: updatedBooking, error } = await supabase
                .from('bookings')
                .update({ status: 'cancelled' })
                .eq('id', id)
                .select()
                .single();
            if (error)
                throw error;
            return c.json({ booking: updatedBooking });
        }
        catch (error) {
            console.error('Cancel booking error:', error);
            return c.json({ error: 'Failed to cancel booking' }, 400);
        }
    }
    static addMinutes(time, minutes) {
        const [hoursStr, minsStr] = time.split(':');
        // Handle undefined values
        const hours = hoursStr ? parseInt(hoursStr, 10) : 0;
        const mins = minsStr ? parseInt(minsStr, 10) : 0;
        // Validate parsed values
        if (isNaN(hours) || isNaN(mins)) {
            throw new Error(`Invalid time format: ${time}`);
        }
        const date = new Date();
        date.setHours(hours, mins + minutes);
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    static timeOverlap(start1, end1, start2, end2) {
        const toMinutes = (time) => {
            const [hoursStr, minutesStr] = time.split(':');
            // Handle undefined values
            const hours = hoursStr ? parseInt(hoursStr, 10) : 0;
            const minutes = minutesStr ? parseInt(minutesStr, 10) : 0;
            // Validate parsed values
            if (isNaN(hours) || isNaN(minutes)) {
                throw new Error(`Invalid time format: ${time}`);
            }
            return hours * 60 + minutes;
        };
        const s1 = toMinutes(start1);
        const e1 = toMinutes(end1);
        const s2 = toMinutes(start2);
        const e2 = toMinutes(end2);
        return s1 < e2 && e1 > s2;
    }
}
//# sourceMappingURL=bookings.js.map