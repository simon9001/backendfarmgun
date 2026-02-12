import { supabase } from '../db/supabaseClient.js';
export class PaymentsController {
    static async initiatePayment(c) {
        try {
            const user = c.get('user');
            const { booking_id } = await c.req.json();
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
            // Create payment record
            const { data: payment, error: paymentError } = await supabase
                .from('payments')
                .insert({
                booking_id,
                amount: booking.service.price,
                status: 'pending',
            })
                .select()
                .single();
            if (paymentError)
                throw paymentError;
            // Create ISO timestamp safely
            const timestamp = new Date();
            const timestampString = timestamp.toISOString().split('.')[0]?.replace(/[^0-9]/g, '') || '';
            // Get user phone safely
            const userPhone = user.phone || '';
            // In production, integrate with Daraja API here
            // For now, return payment details for manual processing
            return c.json({
                payment,
                daraja_payload: {
                    BusinessShortCode: process.env.DARAJA_SHORTCODE || '174379',
                    Password: 'your-encoded-password', // Generate with Daraja
                    Timestamp: timestampString,
                    TransactionType: 'CustomerPayBillOnline',
                    Amount: booking.service.price,
                    PartyA: userPhone, // User's phone number
                    PartyB: process.env.DARAJA_SHORTCODE || '174379',
                    PhoneNumber: userPhone,
                    CallBackURL: `${process.env.BASE_URL || 'https://your-domain.com'}/api/payments/callback`,
                    AccountReference: `Booking-${booking_id}`,
                    TransactionDesc: `Payment for ${booking.service.name || 'booking'}`,
                },
            });
        }
        catch (error) {
            console.error('Initiate payment error:', error);
            return c.json({ error: 'Failed to initiate payment' }, 400);
        }
    }
    static async handlePaymentCallback(c) {
        try {
            const callbackData = await c.req.json();
            console.log('M-Pesa Callback received:', JSON.stringify(callbackData, null, 2));
            const stkCallback = callbackData.Body?.stkCallback;
            if (!stkCallback) {
                return c.json({ error: 'Invalid callback data' }, 400);
            }
            const { ResultCode, ResultDesc, CheckoutRequestID, CallbackMetadata } = stkCallback;
            if (ResultCode !== 0) {
                console.warn('M-Pesa Payment failed:', ResultDesc);
                // Update payment status to failed
                await supabase
                    .from('payments')
                    .update({ status: 'failed', notes: ResultDesc })
                    .eq('transaction_id', CheckoutRequestID);
                return c.json({ message: 'Callback processed with failure status' });
            }
            // Extract metadata items
            const items = CallbackMetadata?.Item || [];
            const amount = items.find((i) => i.Name === 'Amount')?.Value;
            const mpesaReceipt = items.find((i) => i.Name === 'MpesaReceiptNumber')?.Value;
            // 1. Update payment record
            const { data: payment, error: paymentError } = await supabase
                .from('payments')
                .update({
                status: 'success',
                transaction_id: mpesaReceipt, // Replace CheckoutRequestID with actual receipt
                paid_at: new Date().toISOString(),
            })
                .eq('transaction_id', CheckoutRequestID) // Match by the original CheckoutRequestID
                .select()
                .single();
            if (paymentError) {
                console.error('Callback: Payment update error:', paymentError);
                throw paymentError;
            }
            if (!payment) {
                console.error('Callback: Payment record not found for CheckoutRequestID:', CheckoutRequestID);
                return c.json({ error: 'Payment record not found' }, 404);
            }
            // 2. Update booking status
            const { error: bookingError } = await supabase
                .from('bookings')
                .update({ status: 'paid' })
                .eq('id', payment.booking_id);
            if (bookingError) {
                console.error('Callback: Booking update error:', bookingError);
                throw bookingError;
            }
            // 3. Create notification for user
            const { data: booking } = await supabase
                .from('bookings')
                .select('user_id')
                .eq('id', payment.booking_id)
                .single();
            if (booking) {
                await supabase
                    .from('notifications')
                    .insert({
                    user_id: booking.user_id,
                    type: 'payment_receipt',
                    message: `Payment of KES ${amount} received for booking ${payment.booking_id}. Receipt: ${mpesaReceipt}`,
                });
            }
            return c.json({ message: 'Payment processed successfully' });
        }
        catch (error) {
            console.error('Payment callback error:', error);
            return c.json({ error: 'Failed to process payment callback' }, 500);
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