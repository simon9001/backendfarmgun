import { Context } from 'hono';
import { supabase } from '../db/supabaseClient.js';
import { verifyTransaction, chargeMpesa } from '../utils/paystack.js';



export class PaymentsController {
  /**
   * PAYMENT FINITE STATE MACHINE
   * ─────────────────────────────────────────────────────────────────────────
   * States:  pending → success
   *          pending → failed
   *
   * Rules:
   *   - A booking can only have ONE pending payment row at a time.
   *   - When the user retries payment we UPDATE the existing pending row
   *     (new reference, same row) rather than inserting a second row.
   *   - If a payment moves to "failed" the booking can start a fresh attempt,
   *     which creates a new pending row (old one is already failed/done).
   *
   * Flow:
   *   1. GET pending payment for booking.
   *      A) None found → INSERT new pending row, trigger STK push.
   *      B) Found + no transaction_id → UPDATE reference, trigger STK push.
   *      C) Found + has transaction_id → already in flight; return existing ref.
   * ─────────────────────────────────────────────────────────────────────────
   */
  static async initiatePayment(c: Context) {
    try {
      const user = c.get('user');
      const { booking_id, payment_phone, payment_method = 'mpesa' } = await c.req.json();

      if (payment_method === 'mpesa' && !payment_phone) {
        return c.json({ error: 'Payment phone number is required for M-Pesa' }, 400);
      }

      // ── 1. Validate booking ──────────────────────────────────────────────
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select(`*, service:services(price, name)`)
        .eq('id', booking_id)
        .eq('user_id', user.userId)
        .single();

      if (bookingError || !booking) {
        return c.json({ error: 'Booking not found' }, 404);
      }

      if (booking.status !== 'pending') {
        return c.json({ error: 'Booking is already paid or cancelled' }, 400);
      }

      // ── 2. Check for existing pending payment row ────────────────────────
      const { data: existingPayment, error: fetchError } = await supabase
        .from('payments')
        .select('*')
        .eq('booking_id', booking_id)
        .eq('status', 'pending')
        .maybeSingle();

      if (fetchError) {
        console.error('Payment fetch error:', fetchError);
        return c.json({ error: 'Failed to check payment state' }, 500);
      }

      // ── 3. Idempotency: already in-flight with a reference ───────────────
      if (existingPayment?.transaction_id) {
        console.log(`⏩ Payment already in-flight. Reference: ${existingPayment.transaction_id}`);
        return c.json({
          status: 'pay_offline',
          message: payment_method === 'mpesa'
            ? 'A payment prompt was already sent to your phone. Please enter your M-Pesa PIN, or retry below.'
            : 'Payment session already initialized.',
          reference: existingPayment.transaction_id,
          authorization_url: payment_method === 'card'
            ? existingPayment.metadata?.authorization_url
            : undefined,
        });
      }

      const amount = Number(existingPayment?.amount ?? booking.service?.price ?? 0);

      // ── 4. Generate a fresh reference ────────────────────────────────────
      const reference = `BK-${booking_id.split('-')[0]}-${Date.now()}`;

      // ── 5. Trigger the payment gateway ───────────────────────────────────
      if (payment_method === 'card') {
        const { initializeTransaction } = await import('../utils/paystack.js');
        const paystackData = await initializeTransaction(user.email || '', amount, {
          booking_id,
          user_id: user.userId,
          payment_method: 'card',
        });

        const cardReference = paystackData.data.reference;
        const authUrl = paystackData.data.authorization_url;

        // Upsert — UPDATE existing pending row OR create new one
        if (existingPayment) {
          await supabase
            .from('payments')
            .update({
              transaction_id: cardReference,
              metadata: { authorization_url: authUrl },
            })
            .eq('id', existingPayment.id);
        } else {
          await supabase.from('payments').insert({
            booking_id,
            amount,
            status: 'pending',
            transaction_id: cardReference,
            metadata: { authorization_url: authUrl },
          });
        }

        return c.json({
          status: 'success',
          message: 'Card payment initialized.',
          reference: cardReference,
          authorization_url: authUrl,
        });
      }

      // ── M-Pesa (STK Push) ────────────────────────────────────────────────
      const paystackData = await chargeMpesa(
        user.email || '',
        amount,
        payment_phone,
        { booking_id, user_id: user.userId, payment_method: 'mpesa' },
        reference
      );

      const actualReference = paystackData.data?.reference || reference;

      if (existingPayment) {
        // Reality B: pending row exists but no reference yet — refresh the reference
        console.log(`♻️  Refreshing reference on existing pending payment. New ref: ${actualReference}`);
        await supabase
          .from('payments')
          .update({ transaction_id: actualReference })
          .eq('id', existingPayment.id);
      } else {
        // Reality A: no pending row — create one
        console.log(`🆕 Creating pending payment. Ref: ${actualReference}`);
        await supabase.from('payments').insert({
          booking_id,
          amount,
          status: 'pending',
          transaction_id: actualReference,
        });
      }

      // Persist the phone used for payment on the booking
      await supabase
        .from('bookings')
        .update({ payment_phone })
        .eq('id', booking_id);

      console.log(`✅ STK Push sent. Reference: ${actualReference}`);

      return c.json({
        status: paystackData.data.status,
        message: paystackData.data.display_text || 'STK Push sent to your phone. Enter your M-Pesa PIN to confirm.',
        reference: actualReference,
      });

    } catch (error: any) {
      console.error('Initiate payment error:', error);
      return c.json({ error: error.message || 'Failed to initiate payment' }, 400);
    }
  }

  static async verifyPayment(c: Context) {
    try {
      const { reference } = await c.req.json();
      if (!reference) return c.json({ error: 'Reference is required' }, 400);

      const paystackData = await verifyTransaction(reference);

      if (paystackData.data.status !== 'success') {
        return c.json({ status: paystackData.data.status, message: 'Payment not successful yet' });
      }

      const { booking_id } = paystackData.data.metadata;

      console.log(`✅ Payment verified as success. booking_id=${booking_id} reference=${reference}`);

      // 1. Mark the payment row as success (match by transaction_id — always unique)
      const { error: paymentError } = await supabase
        .from('payments')
        .update({
          status: 'success',
          paid_at: new Date().toISOString(),
        })
        .eq('transaction_id', reference);

      if (paymentError) {
        console.error('Payment update error:', paymentError);
      }

      // 2. Transition booking to "paid" (Only if it was pending to avoid double automation)
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .update({ status: 'paid' })
        .eq('id', booking_id)
        .eq('status', 'pending')
        .select(`*, service:services(name, price), user:users!bookings_user_id_fkey(email, name)`)
        .maybeSingle();

      if (bookingError) throw bookingError;

      // 3. Trigger unified automation ONLY if we actually transitioned the status
      if (booking) {
        const { MeetingAutomationService } = await import('../services/meetingAutomation.js');
        await MeetingAutomationService.processSuccessfulPayment(booking_id, reference);
      } else {
        console.log(`ℹ️ Booking ${booking_id} already processed or status not pending.`);
      }

      return c.json({ status: 'success', booking: booking || { id: booking_id, status: 'paid' } });
    } catch (error: any) {
      console.error('Verify payment error:', error);
      return c.json({ error: error.message || 'Failed to verify payment' }, 400);
    }
  }

  /**
   * Webhook handler — Paystack pushes charge.success / charge.failed here.
   * Uses transaction_id (reference) to find the payment row — never booking_id —
   * so there's no ambiguity even if old rows exist.
   */
  static async handlePaymentCallback(c: Context) {
    try {
      const body = await c.req.json();
      const reference = body.data?.reference;
      const booking_id = body.data?.metadata?.booking_id;

      if (!reference) {
        return c.json({ received: true });
      }

      if (body.event === 'charge.success') {
        // Transition: pending → success
        await supabase
          .from('payments')
          .update({ status: 'success', paid_at: new Date().toISOString() })
          .eq('transaction_id', reference);

        if (booking_id) {
          // Transition booking: pending → paid (Restrictive update for idempotency)
          const { data: updatedBooking } = await supabase
            .from('bookings')
            .update({ status: 'paid' })
            .eq('id', booking_id)
            .eq('status', 'pending')
            .select('id')
            .maybeSingle();

          if (updatedBooking) {
            // Trigger unified automation (Meet creation + Emails + Notifications)
            const { MeetingAutomationService } = await import('../services/meetingAutomation.js');
            await MeetingAutomationService.processSuccessfulPayment(booking_id, reference);
            console.log(`✅ Webhook: charge.success processed. booking_id=${booking_id}`);
          } else {
            console.log(`ℹ️ Webhook: booking_id=${booking_id} already processed or not pending.`);
          }
        }

      } else if (body.event === 'charge.failed') {
        // Transition: pending → failed
        const failureMessage = body.data?.gateway_response || 'Payment failed';
        await supabase.from('payments').update({ status: 'failed' }).eq('transaction_id', reference);
        console.log(`❌ Webhook: charge.failed. booking_id=${booking_id} reason=${failureMessage}`);
      }

      return c.json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      return c.json({ error: 'Webhook failed' }, 400);
    }
  }

  static async getPaymentHistory(c: Context) {
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

      if (error) throw error;

      return c.json({ payments: payments || [] });
    } catch (error) {
      console.error('Get payment history error:', error);
      return c.json({ error: 'Failed to fetch payment history' }, 500);
    }
  }
}