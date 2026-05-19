import { supabase } from '../db/supabaseClient.js';
import { env } from '../db/envConfig.js';
import { createGoogleMeet } from '../utils/googleCalendar.js';
import { sendEmail } from '../utils/resend.js';
// Helper for throttling
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
export class MeetingAutomationService {
    static async processSuccessfulPayment(bookingId, paymentReference, isReschedule = false) {
        console.log(`🚀 Starting meeting automation for booking: ${bookingId} (isReschedule: ${isReschedule})`);
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
            // check if virtual (Relaxed detection for sessions and consultations)
            const isVirtual = booking.pricing_option?.toLowerCase().includes('virtual') ||
                booking.pricing_option?.toLowerCase().includes('session') ||
                booking.service?.name?.toLowerCase().includes('consultation');
            console.log(`🔍 Booking type: ${isVirtual ? 'VIRTUAL' : 'PHYSICAL'} (Option: ${booking.pricing_option})`);
            let meetLink = booking.meeting_link;
            // 2. Prepare times for Google Meet (only if virtual AND no link exists or is reschedule)
            if (isVirtual && (!meetLink || isReschedule)) {
                const [year, month, day] = booking.date.split('-').map(Number);
                const [hour, minute] = booking.start_time.split(':').map(Number);
                const startTimeDate = new Date(year, month - 1, day, hour, minute);
                const startDateTime = startTimeDate.toISOString();
                const endDateTimeDate = new Date(startTimeDate.getTime() + (booking.service.duration_mins || 30) * 60000);
                const endDateTime = endDateTimeDate.toISOString();
                // 3. Create Google Meet (only if credentials exist)
                if (env.GOOGLE_CLIENT_EMAIL && env.GOOGLE_PRIVATE_KEY) {
                    console.log(`📅 Creating/Updating Google Meet for virtual booking ${bookingId}...`);
                    try {
                        const meetResponse = await createGoogleMeet({
                            summary: `${isReschedule ? 'RESCHEDULED: ' : ''}${booking.service.name} - Farm with Irene`,
                            description: `Consultation for ${booking.user.name}. Service: ${booking.service.name}. Ref: ${paymentReference || 'N/A'}`,
                            startDateTime,
                            endDateTime,
                        });
                        meetLink = meetResponse.link;
                        // 4. Update booking with meeting link
                        if (meetLink) {
                            await supabase
                                .from('bookings')
                                .update({ meeting_link: meetLink })
                                .eq('id', bookingId);
                        }
                    }
                    catch (meetErr) {
                        console.error(`⚠️ Google Meet link generation failed: ${meetErr.message}`);
                    }
                }
            }
            // 5. Fetch all admins
            const { data: admins } = await supabase
                .from('users')
                .select('email, name')
                .eq('role', 'admin');
            const adminEmails = admins?.map(a => a.email) || [];
            const fromEmail = 'Farm with Irene <confirmation@farmwithirene.online>';
            const bookingDateFormatted = new Date(booking.date).toLocaleDateString('en-KE', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Africa/Nairobi'
            });
            // 6. User Email Content
            const subject = isReschedule
                ? `📅 Rescheduled: ${booking.service.name} | Farm with Irene`
                : `Confirmed: ${booking.service.name} | Farm with Irene`;
            const userHtml = `
            <!DOCTYPE html>
            <html>
            <body style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 0; background-color: #f9fafb;">
                <div style="background-color: ${isReschedule ? '#1d4ed8' : '#16a34a'}; padding: 40px 20px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 24px;">${isReschedule ? 'Booking Rescheduled 📅' : 'Booking Confirmed! ✅'}</h1>
                    <p style="margin: 10px 0 0; opacity: 0.9;">${isReschedule ? "Your session has been moved to a new time." : "We're excited to help you grow, " + booking.user.name + "."}</p>
                </div>
                <div style="padding: 30px; background: white; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                    <div style="margin-bottom: 25px;">
                        <h3 style="color: ${isReschedule ? '#1e40af' : '#15803d'}; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">${isReschedule ? 'New Schedule Details' : 'Consultation Details'}</h3>
                        <p><strong>Service:</strong> ${booking.service.name}</p>
                        <p><strong>Date:</strong> ${bookingDateFormatted}</p>
                        <p><strong>Time:</strong> ${booking.start_time} (EAT)</p>
                        <p><strong>Mode:</strong> ${booking.pricing_option || 'General'}</p>
                        ${paymentReference ? `<p><strong>Reference:</strong> <code>${paymentReference}</code></p>` : ''}
                    </div>

                    ${isVirtual && meetLink ? `
                    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 25px; text-align: center; margin: 30px 0;">
                        <h4 style="margin: 0 0 10px; color: #166534;">Join Your Online Meeting</h4>
                        <p style="font-size: 14px; color: #374151; margin-bottom: 20px;">Use the button below to join the call at the scheduled time.</p>
                        <a href="${meetLink}" style="display: inline-block; background-color: #16a34a; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Join Meeting NOW</a>
                        <p style="margin-top: 15px; font-size: 12px; color: #6b7280;">Link: <a href="${meetLink}" style="color: #16a34a;">${meetLink}</a></p>
                    </div>
                    ` : (isVirtual ? `
                    <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 25px; text-align: center; margin: 30px 0;">
                        <p style="margin: 0; color: #92400e;">Your meeting link will be shared via email shortly before the session.</p>
                    </div>
                    ` : `
                    <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 25px; text-align: center; margin: 30px 0;">
                        <p style="margin: 0; color: #1e40af;">See you for our <strong>physical visit</strong>! We will coordinate the exact location via phone.</p>
                    </div>
                    `)}

                    <div style="color: #6b7280; font-size: 14px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
                        <p>Questions? Reach out to us via WhatsApp at <a href="https://wa.me/254727755769" style="color: #16a34a; text-decoration: none; font-weight: 600;">+254 727 755769</a>.</p>
                    </div>
                </div>
                <div style="text-align: center; padding: 20px; font-size: 12px; color: #9ca3af;">
                    &copy; ${new Date().getFullYear()} Farm with Irene. All rights reserved.
                </div>
            </body>
            </html>
            `;
            console.log(`📧 Sending confirmation email to user: ${booking.user.email}`);
            await sendEmail(booking.user.email, subject, userHtml, fromEmail);
            // 7. Admin Email Content
            if (adminEmails.length > 0) {
                // Throttle: Wait before sending admin emails to avoid Resend 429
                console.log(`⏳ Throttling: Waiting 1.5s before admin emails...`);
                await delay(1500);
                const adminHtml = `
                <!DOCTYPE html>
                <html>
                <body style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; background-color: #f8fafc;">
                    <h2 style="color: ${isReschedule ? '#1e40af' : '#15803d'}; text-align: center;">🔔 ${isReschedule ? 'Booking Rescheduled' : 'New Paid Booking'}</h2>
                    
                    <div style="background: white; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                        <h3 style="margin-top: 0; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; color: #334155;">Booking Details</h3>
                        <p><strong>Client:</strong> ${booking.user.name} (${booking.user.email})</p>
                        <p><strong>Service:</strong> ${booking.service.name}</p>
                        <p><strong>Date:</strong> ${bookingDateFormatted}</p>
                        <p><strong>Time:</strong> ${booking.start_time} (EAT)</p>
                        <p><strong>Option:</strong> ${booking.pricing_option}</p>
                        <p><strong>Meeting Link:</strong> ${meetLink ? `<a href="${meetLink}" style="color: #16a34a; font-weight: bold;">${meetLink}</a>` : '<span style="color: #dc2626;">Not Generated (Physical Visit?)</span>'}</p>
                        ${paymentReference ? `<p><strong>Paystack Ref:</strong> <code>${paymentReference}</code></p>` : ''}
                    </div>

                    <div style="margin-top: 25px; text-align: center;">
                        ${meetLink ? `
                        <a href="${meetLink}" style="display: inline-block; background-color: ${isReschedule ? '#1d4ed8' : '#16a34a'}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-right: 10px;">Join Call</a>
                        ` : ''}
                        <a href="${env.CORS_ORIGIN}/admin/dashboard" style="display: inline-block; background-color: #475569; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Review Dashboard</a>
                    </div>

                    <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #94a3b8;">
                        Manage bookings at <a href="${env.CORS_ORIGIN}" style="color: #64748b;">${env.CORS_ORIGIN}</a>
                    </div>
                </body>
                </html>
                `;
                const adminSubject = isReschedule
                    ? `📅 Rescheduled: ${booking.user.name} - ${booking.service.name}`
                    : `🔔 New Booking: ${booking.user.name} - ${booking.service.name}`;
                for (const adminEmail of adminEmails) {
                    console.log(`📧 Sending notification to admin: ${adminEmail}`);
                    await sendEmail(adminEmail, adminSubject, adminHtml, fromEmail);
                    // Critical delay between individual admin emails (Resend free tier is strict)
                    await delay(1200);
                }
            }
            // 8. Create notification for user
            await supabase.from('notifications').insert({
                user_id: booking.user_id,
                type: 'booking_confirmation',
                message: isReschedule
                    ? `Your booking for ${booking.service.name} has been rescheduled to ${bookingDateFormatted} at ${booking.start_time}.`
                    : (isVirtual
                        ? `Your virtual session for ${booking.service.name} is confirmed! Check your email for the meeting link.`
                        : `Your booking for ${booking.service.name} is confirmed! We'll coordinate the visit details via phone.`),
                sent_at: new Date().toISOString(),
            });
            console.log(`✅ Meeting automation completed for booking ${bookingId}`);
        }
        catch (error) {
            console.error(`❌ Meeting Automation Error for booking ${bookingId}:`, error.message);
        }
    }
}
//# sourceMappingURL=meetingAutomation.js.map