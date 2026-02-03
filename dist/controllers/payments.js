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
            // Verify callback from Daraja
            // In production, verify signature
            const { ResultCode, ResultDesc, CheckoutRequestID, Amount, MpesaReceiptNumber, } = callbackData;
            if (ResultCode !== '0') {
                console.error('Payment failed:', ResultDesc);
                return c.json({ error: 'Payment failed' }, 400);
            }
            // Find payment by reference
            const { data: payment, error: paymentError } = await supabase
                .from('payments')
                .update({
                status: 'success',
                transaction_id: MpesaReceiptNumber,
                paid_at: new Date().toISOString(),
            })
                .eq('transaction_id', CheckoutRequestID)
                .select()
                .single();
            if (paymentError)
                throw paymentError;
            if (!payment) {
                return c.json({ error: 'Payment not found' }, 404);
            }
            // Update booking status
            const { error: bookingError } = await supabase
                .from('bookings')
                .update({ status: 'paid' })
                .eq('id', payment.booking_id);
            if (bookingError)
                throw bookingError;
            // Create notification
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
                    message: `Payment of KES ${Amount} received for booking ${payment.booking_id}. Receipt: ${MpesaReceiptNumber}`,
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