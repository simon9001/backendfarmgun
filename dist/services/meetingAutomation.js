import { supabase } from '../db/supabaseClient.js';
import { env } from '../db/envConfig.js';
import { createGoogleMeet } from '../utils/googleCalendar.js';
import { sendEmail } from '../utils/resend.js';
export class MeetingAutomationService {
    static async processSuccessfulPayment(bookingId) {
        console.log(`🚀 Starting meeting automation for booking: ${bookingId}`);
        try {
            // 1. Fetch booking details with service and user info
            const { data: booking, error: fetchError } = await supabase
                .from('bookings')
                .select(`
                    *,
                    service:services(*),
                    user:users!bookings_user_id_fkey(*)
                `)
                .eq('id', bookingId)
                .single();
            if (fetchError || !booking) {
                throw new Error(`Failed to fetch booking: ${fetchError?.message}`);
            }
            // Already has a link? Skip to avoid duplicates
            if (booking.meeting_link) {
                console.log(`⏩ Booking ${bookingId} already has a meeting link. Skipping.`);
                return;
            }
            // Check if Google credentials are present
            if (!env.GOOGLE_CLIENT_EMAIL || !env.GOOGLE_PRIVATE_KEY) {
                console.warn(`⚠️ Skipping meeting creation for booking ${bookingId} because Google API credentials are missing.`);
                // We still want to send the notification/email if possible, but without the meet link
            }
            // 2. Prepare times
            // booking.date is YYYY-MM-DD, booking.start_time is HH:mm
            const [year, month, day] = booking.date.split('-').map(Number);
            const [hour, minute] = booking.start_time.split(':').map(Number);
            const startTimeDate = new Date(year, month - 1, day, hour, minute);
            const startDateTime = startTimeDate.toISOString();
            // Calculate end time
            const endDateTimeDate = new Date(startTimeDate.getTime() + (booking.service.duration_mins || 30) * 60000);
            const endDateTime = endDateTimeDate.toISOString();
            // 3. Create Google Meet (only if credentials exist)
            let meetLink = null;
            if (env.GOOGLE_CLIENT_EMAIL && env.GOOGLE_PRIVATE_KEY) {
                console.log(`📅 Creating Google Meet for ${booking.user.email}...`);
                const meetResponse = await createGoogleMeet({
                    summary: `${booking.service.name} - Farm with Irene`,
                    description: `Consultation for ${booking.user.name}. Service: ${booking.service.name}`,
                    startDateTime,
                    endDateTime,
                    userEmail: booking.user.email
                });
                meetLink = meetResponse.link;
            }
            // 4. Update booking with meeting link (if we have one)
            if (meetLink) {
                const { error: updateError } = await supabase
                    .from('bookings')
                    .update({ meeting_link: meetLink })
                    .eq('id', bookingId);
                if (updateError) {
                    console.error(`❌ Failed to update booking with meeting link: ${updateError.message}`);
                }
            }
            // 5. Fetch all admins
            const { data: admins } = await supabase
                .from('users')
                .select('email, name')
                .eq('role', 'admin');
            const adminEmails = admins?.map(a => a.email) || [];
            // 6. Send emails via Resend
            const fromEmail = env.RESEND_FROM_EMAIL;
            // Email to User
            await sendEmail(booking.user.email, `📅 Meeting Link: ${booking.service.name} | Farm with Irene`, `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <h2 style="color: #16a34a;">Meeting Confirmed!</h2>
                    <p>Hi ${booking.user.name},</p>
                    <p>Your consultation for <strong>${booking.service.name}</strong> has been scheduled.</p>
                    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString()}</p>
                        <p style="margin: 5px 0;"><strong>Time:</strong> ${booking.start_time}</p>
                        <p style="margin: 15px 0;"><a href="${meetLink}" style="background: #16a34a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">Join Google Meet</a></p>
                    </div>
                    <p>Meeting Link: <a href="${meetLink}">${meetLink}</a></p>
                    <p style="color: #64748b; font-size: 0.9em;">If you have any questions, feel free to contact us.</p>
                </div>
                `, fromEmail);
            // Emails to Admins
            if (adminEmails.length > 0) {
                for (const adminEmail of adminEmails) {
                    await sendEmail(adminEmail, `🔔 New Booking: ${booking.user.name} - ${booking.service.name}`, `
                        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                            <h2 style="color: #15803d;">New Paid Booking Alert</h2>
                            <p>A new consultation has been booked and paid for.</p>
                            <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <p style="margin: 5px 0;"><strong>Client:</strong> ${booking.user.name} (${booking.user.email})</p>
                                <p style="margin: 5px 0;"><strong>Service:</strong> ${booking.service.name}</p>
                                <p style="margin: 5px 0;"><strong>Date:</strong> ${booking.date}</p>
                                <p style="margin: 5px 0;"><strong>Time:</strong> ${booking.start_time}</p>
                                <p style="margin: 15px 0;"><a href="${meetLink}" style="background: #15803d; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Meeting</a></p>
                            </div>
                            <p>Meeting Link: <a href="${meetLink}">${meetLink}</a></p>
                        </div>
                        `, fromEmail);
                }
            }
            // 7. Create notification for user
            await supabase.from('notifications').insert({
                user_id: booking.user_id,
                type: 'booking_confirmation',
                message: meetLink
                    ? `Your meeting for ${booking.service.name} is scheduled! Check your email for the link.`
                    : `Your booking for ${booking.service.name} is confirmed! We'll send you the meeting details soon.`,
            });
            console.log(`✅ Meeting automation completed for booking ${bookingId}`);
        }
        catch (error) {
            console.error(`❌ Meeting Automation Error for booking ${bookingId}:`, error.message);
            // In a production app, we might want to retry this or alert the dev team
        }
    }
}
//# sourceMappingURL=meetingAutomation.js.map