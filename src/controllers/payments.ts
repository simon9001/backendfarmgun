import { Context } from 'hono';
import { supabase } from '../db/supabaseClient.js';
import {  verifyTransaction, chargeMpesa } from '../utils/paystack.js';

import { sendEmail } from '../utils/resend.js';

export class PaymentsController {
  static async initiatePayment(c: Context) {
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

      // Direct M-Pesa Charge (STK Push)
      const reference = `BK-${booking.id.split('-')[0]}-${Date.now()}`;
      const paystackData = await chargeMpesa(
        user.email || '',
        Number(booking.service.price),
        payment_phone,
        {
          booking_id: booking.id,
          user_id: user.userId
        },
        reference
      );


      return c.json({
        status: paystackData.data.status,
        message: paystackData.data.display_text || 'STK Push sent to your phone.',
        reference: paystackData.data.reference
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

      // 1. Update payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .update({
          status: 'success',
          transaction_id: reference,
          paid_at: new Date().toISOString(),
        })
        .eq('booking_id', booking_id)
        .select()
        .single();

      if (paymentError) throw paymentError;

      // 2. Update booking status
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .update({ status: 'paid' })
        .eq('id', booking_id)
        .select(`
          *,
          service:services(name),
          user:users(email, name)
        `)
        .single();

      if (bookingError) throw bookingError;

      // 3. Send confirmation email
      await sendEmail(
        booking.user.email,
        'Booking Confirmed - Farm with Irene',
        `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px;">
          <h2 style="color: #15803d;">Booking Confirmed!</h2>
          <p>Hi ${booking.user.name},</p>
          <p>Your booking for <strong>${booking.service.name}</strong> has been successfully scheduled and paid for.</p>
          <div style="background-color: #f0fdf4; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Date:</strong> ${booking.date}</p>
            <p style="margin: 4px 0;"><strong>Time:</strong> ${booking.start_time} - ${booking.end_time}</p>
          </div>
          <p>We look forward to seeing you then!</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #666; font-size: 0.8em;">If you have any questions, feel free to contact us.</p>
        </div>
        `
      );

      return c.json({ status: 'success', booking });
    } catch (error: any) {
      console.error('Verify payment error:', error);
      return c.json({ error: error.message || 'Failed to verify payment' }, 400);
    }
  }

  static async handlePaymentCallback(c: Context) {
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
      } else if (body.event === 'charge.failed') {
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