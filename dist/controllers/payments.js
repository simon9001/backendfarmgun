import { supabase } from '../db/supabaseClient.js';
import { verifyTransaction, chargeMpesa } from '../utils/paystack.js';
import { sendEmail } from '../utils/resend.js';
import { MeetingAutomationService } from '../services/meetingAutomation.js';
export class PaymentsController {
    static async initiatePayment(c) {
        try {
            const user = c.get('user');
            const { booking_id, payment_phone } = await c.req.json();
            if (!payment_phone) {
                return c.json({ error: 'Payment phone number is required' }, 400);
            }
            // Get booking details
            const { data: booking, error: bookingError } = await supabase
                .from('bookings')
                .select(`
          *,
          service:services(price, name)
        `)
                .eq('id', booking_id)
                .eq('user_id', user.userId)
                .single();
            if (bookingError || !booking) {
                return c.json({ error: 'Booking not found' }, 404);
            }
            if (booking.status !== 'pending') {
                return c.json({ error: 'Booking already paid or cancelled' }, 400);
            }
            // Check if service exists and has a price
            if (!booking.service || typeof booking.service.price !== 'number') {
                return c.json({ error: 'Invalid service or price' }, 400);
            }
            // ✅ IDEMPOTENCY & RETRY LOGIC:
            // Check if there's already an active (pending) payment for this booking
            const { data: existingPayment } = await supabase
                .from('payments')
                .select('transaction_id, created_at, status')
                .eq('booking_id', booking.id)
                .eq('status', 'pending')
                .not('transaction_id', 'is', null)
                .maybeSingle();
            if (existingPayment) {
                const createdTime = new Date(existingPayment.created_at).getTime();
                const secondsPassed = (Date.now() - createdTime) / 1000;
                // If it's a very recent request (race condition or double click), reuse it
                if (secondsPassed < 30) {
                    console.log(`⏩ Returning recent reference: ${existingPayment.transaction_id}`);
                    return c.json({
                        status: 'pay_offline',
                        message: 'Payment prompt already sent to your phone. Please enter your M-Pesa PIN.',
                        reference: existingPayment.transaction_id,
                    });
                }
                // If it's old, we MUST delete it now because the UNIQUE index 
                // prevents us from inserting a new pending row for this booking.
                console.log(`🔄 Replacing old reference ${existingPayment.transaction_id} (${secondsPassed.toFixed(0)}s ago).`);
                await supabase
                    .from('payments')
                    .delete()
                    .eq('transaction_id', existingPayment.transaction_id)
                    .eq('status', 'pending');
            }
            // Generate reference BEFORE calling Paystack
            const reference = `BK-${booking.id.split('-')[0]}-${Date.now()}`;
            // Insert payment record. 
            // If a concurrent request just inserted one, this will FAIL due to the UNIQUE constraint.
            const { error: insertError } = await supabase
                .from('payments')
                .insert({
                booking_id: booking.id,
                amount: Number(booking.service.price),
                status: 'pending',
                transaction_id: reference,
            });
            if (insertError) {
                // Handle unique constraint violation (code 23505 in Postgres)
                if (insertError.code === '23505') {
                    console.log("⚠️ Concurrent initiation detected. Retrying fetch of existing payment.");
                    const { data: concurrentPayment } = await supabase
                        .from('payments')
                        .select('transaction_id')
                        .eq('booking_id', booking.id)
                        .eq('status', 'pending')
                        .single();
                    if (concurrentPayment) {
                        return c.json({
                            status: 'pay_offline',
                            message: 'Payment prompt already sent. Please check your phone.',
                            reference: concurrentPayment.transaction_id,
                        });
                    }
                }
                console.error('Payment insert error:', insertError);
                return c.json({ error: 'Failed to prepare payment. If you have an active prompt, please complete it.' }, 500);
            }
            // Now fire the STK push
            let paystackData;
            try {
                paystackData = await chargeMpesa(user.email || '', Number(booking.service.price), payment_phone, {
                    booking_id: booking.id,
                    user_id: user.userId
                }, reference);
            }
            catch (paystackError) {
                console.error('❌ Paystack STK Push failed:', paystackError.message);
                // CRITICAL: Cleanup the local payment record we just created.
                await supabase
                    .from('payments')
                    .delete()
                    .eq('transaction_id', reference);
                throw paystackError;
            }
            const actualReference = paystackData.data?.reference || reference;
            // Update phone number on booking
            await supabase
                .from('bookings')
                .update({ payment_phone })
                .eq('id', booking.id);
            console.log(`✅ STK Push initiated. Reference: ${actualReference}`);
            return c.json({
                status: paystackData.data.status,
                message: paystackData.data.display_text || 'STK Push sent to your phone. Enter your M-Pesa PIN to confirm.',
                reference: actualReference,
            });
        }
        catch (error) {
            console.error('Initiate payment error:', error);
            return c.json({ error: error.message || 'Failed to initiate payment' }, 400);
        }
    }
    static async verifyPayment(c) {
        try {
            const { reference } = await c.req.json();
            if (!reference)
                return c.json({ error: 'Reference is required' }, 400);
            const paystackData = await verifyTransaction(reference);
            if (paystackData.data.status !== 'success') {
                return c.json({ status: paystackData.data.status, message: 'Payment not successful yet' });
            }
            const { booking_id } = paystackData.data.metadata;
            console.log(`✅ Payment verified as success. Updating booking ${booking_id} and payment reference ${reference}`);
            // 1. Update payment record by transaction_id (reference) — NOT booking_id
            // This avoids the .single() bug when multiple pending rows exist for same booking
            const { error: paymentError } = await supabase
                .from('payments')
                .update({
                status: 'success',
                paid_at: new Date().toISOString(),
            })
                .eq('transaction_id', reference);
            if (paymentError) {
                console.error('Payment update error:', paymentError);
                // Don't throw — still update the booking status
            }
            // 2. Delete any leftover orphaned pending rows for this booking
            await supabase
                .from('payments')
                .delete()
                .eq('booking_id', booking_id)
                .eq('status', 'pending')
                .neq('transaction_id', reference);
            // 3. Update booking status to 'paid'
            const { data: booking, error: bookingError } = await supabase
                .from('bookings')
                .update({ status: 'paid' })
                .eq('id', booking_id)
                .select(`
          *,
          service:services(name, price),
          user:users!bookings_user_id_fkey(email, name)
        `)
                .single();
            if (bookingError)
                throw bookingError;
            // 4. Format date nicely
            const paidAt = new Date().toLocaleString('en-KE', {
                dateStyle: 'full',
                timeStyle: 'short',
                timeZone: 'Africa/Nairobi',
            });
            const bookingDate = new Date(booking.date).toLocaleDateString('en-KE', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZone: 'Africa/Nairobi',
            });
            // 5. Send premium receipt email (non-blocking)
            sendEmail(booking.user.email, `✅ Payment Receipt – ${booking.service.name} | Farm with Irene`, `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f7f4;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f4;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;">
        
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#15803d 0%,#166534 100%);padding:36px 40px;text-align:center;">
            <p style="margin:0 0 4px 0;color:#bbf7d0;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:2px;">Farm with Irene</p>
            <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;">Payment Confirmed ✓</h1>
            <p style="margin:8px 0 0 0;color:#dcfce7;font-size:14px;">Your booking is officially locked in.</p>
          </td>
        </tr>

        <!-- Receipt Badge -->
        <tr>
          <td style="padding:0 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:2px solid #bbf7d0;border-radius:12px;margin:28px 0 0;overflow:hidden;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 4px 0;color:#15803d;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">M-Pesa Receipt No.</p>
                  <p style="margin:0;color:#14532d;font-size:20px;font-weight:800;font-family:monospace;">${reference}</p>
                </td>
                <td style="padding:20px 24px;text-align:right;">
                  <p style="margin:0 0 4px 0;color:#15803d;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">Amount Paid</p>
                  <p style="margin:0;color:#14532d;font-size:24px;font-weight:900;">KES ${Number(booking.service?.price || 0).toLocaleString()}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Booking Details -->
        <tr>
          <td style="padding:28px 40px 0;">
            <p style="margin:0 0 16px 0;color:#374151;font-size:16px;font-weight:700;">Booking Details</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
                  <span style="color:#6b7280;font-size:13px;">Hi</span>
                </td>
                <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;text-align:right;">
                  <span style="color:#111827;font-size:13px;font-weight:600;">${booking.user.name}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
                  <span style="color:#6b7280;font-size:13px;">Service</span>
                </td>
                <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;text-align:right;">
                  <span style="color:#111827;font-size:13px;font-weight:600;">${booking.service.name}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
                  <span style="color:#6b7280;font-size:13px;">Date</span>
                </td>
                <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;text-align:right;">
                  <span style="color:#111827;font-size:13px;font-weight:600;">${bookingDate}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
                  <span style="color:#6b7280;font-size:13px;">Time</span>
                </td>
                <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;text-align:right;">
                  <span style="color:#111827;font-size:13px;font-weight:600;">${booking.start_time} – ${booking.end_time}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0;">
                  <span style="color:#6b7280;font-size:13px;">Payment Date</span>
                </td>
                <td style="padding:10px 0;text-align:right;">
                  <span style="color:#111827;font-size:13px;font-weight:600;">${paidAt}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- What's Next -->
        <tr>
          <td style="padding:24px 40px;">
            <div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:16px 20px;">
              <p style="margin:0 0 6px 0;color:#92400e;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">What happens next?</p>
              <p style="margin:0;color:#78350f;font-size:13px;line-height:1.6;">
                You'll receive a meeting link via email before your session. Please keep an eye on your inbox. If you have any questions, reply to this email or WhatsApp us on  <a href="https://wa.me/+254 727 755769" 
         style="color:#16a34a;font-weight:600;text-decoration:none;">
        +254 727 755769
      </a>. .
              </p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:24px 40px;text-align:center;border-top:1px solid #f3f4f6;">
            <p style="margin:0 0 4px 0;color:#374151;font-size:13px;font-weight:600;">Farm with Irene</p>
            <p style="margin:0;color:#9ca3af;font-size:12px;">confirm@farmwithirene.online &nbsp;•&nbsp; farmwithirene.online</p>
            <p style="margin:12px 0 0 0;color:#d1d5db;font-size:11px;">This is an automated receipt. Please save it for your records.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`, 'Farm with Irene <confirm@farmwithirene.online>').catch((e) => console.error('Receipt email error:', e.message));
            // 6. Trigger meeting automation (non-blocking)
            MeetingAutomationService.processSuccessfulPayment(booking_id).catch(e => console.error('Meeting automation failed:', e.message));
            return c.json({ status: 'success', booking });
        }
        catch (error) {
            console.error('Verify payment error:', error);
            return c.json({ error: error.message || 'Failed to verify payment' }, 400);
        }
    }
    static async handlePaymentCallback(c) {
        try {
            const body = await c.req.json();
            const reference = body.data?.reference;
            const booking_id = body.data?.metadata?.booking_id;
            if (body.event === 'charge.success') {
                const { error: paymentError } = await supabase
                    .from('payments')
                    .update({
                    status: 'success',
                    transaction_id: reference,
                    paid_at: new Date().toISOString()
                })
                    .eq('booking_id', booking_id);
                if (paymentError) {
                    console.error('Webhook: Failed to update payment status:', paymentError);
                }
                const { error: bookingError } = await supabase
                    .from('bookings')
                    .update({ status: 'paid' })
                    .eq('id', booking_id);
                if (bookingError) {
                    console.error('Webhook: Failed to update booking status:', bookingError);
                }
                else {
                    // Trigger meeting automation (non-blocking)
                    MeetingAutomationService.processSuccessfulPayment(booking_id).catch(e => console.error('Webhook: Meeting automation failed:', e.message));
                }
            }
            else if (body.event === 'charge.failed') {
                const failureMessage = body.data?.gateway_response || 'Payment failed';
                await supabase
                    .from('payments')
                    .update({
                    status: 'failed',
                    transaction_id: reference
                })
                    .eq('booking_id', booking_id);
                console.log(`Webhook: Payment failed for booking ${booking_id}: ${failureMessage}`);
            }
            return c.json({ received: true });
        }
        catch (error) {
            console.error('Webhook error:', error);
            return c.json({ error: 'Webhook failed' }, 400);
        }
    }
    static async getPaymentHistory(c) {
        try {
            const user = c.get('user');
            const { data: payments, error } = await supabase
                .from('payments')
                .select(`
          *,
          booking:bookings(
            *,
            service:services(*)
          )
        `)
                .eq('booking.user_id', user.userId)
                .order('paid_at', { ascending: false });
            if (error)
                throw error;
            return c.json({ payments: payments || [] });
        }
        catch (error) {
            console.error('Get payment history error:', error);
            return c.json({ error: 'Failed to fetch payment history' }, 500);
        }
    }
}
//# sourceMappingURL=payments.js.map