import { supabase } from '../db/supabaseClient.js';

/**
 * CLEANUP JOB — runs every 30 minutes.
 * Deletes unpaid bookings older than 24 hours so the slots free up again.
 *
 * Logic:
 *  1. Find bookings with status = 'pending' and created_at < NOW() - 24h
 *  2. Delete their associated pending payment rows
 *  3. Delete the bookings
 */
export const startCleanupJob = () => {
    const INTERVAL_MS = 30 * 60 * 1000; // every 30 minutes
    const CUTOFF_HOURS = 24;

    const run = async () => {
        try {
            const cutoff = new Date(Date.now() - CUTOFF_HOURS * 60 * 60 * 1000).toISOString();

            // Find stale pending bookings
            const { data: staleBookings, error: fetchError } = await supabase
                .from('bookings')
                .select('id')
                .eq('status', 'pending')
                .lt('created_at', cutoff);

            if (fetchError) {
                console.error('[Cleanup] Error fetching stale bookings:', fetchError.message);
                return;
            }

            if (!staleBookings || staleBookings.length === 0) {
                console.log('[Cleanup] No stale bookings found.');
                return;
            }

            const ids = staleBookings.map(b => b.id);
            console.log(`[Cleanup] Found ${ids.length} stale booking(s) to remove:`, ids);

            // Delete pending payments for these bookings
            const { error: paymentDeleteError } = await supabase
                .from('payments')
                .delete()
                .in('booking_id', ids)
                .eq('status', 'pending');

            if (paymentDeleteError) {
                console.error('[Cleanup] Error deleting stale payments:', paymentDeleteError.message);
            }

            // Delete the bookings themselves (cascade frees the availability slots)
            const { error: bookingDeleteError } = await supabase
                .from('bookings')
                .delete()
                .in('id', ids);

            if (bookingDeleteError) {
                console.error('[Cleanup] Error deleting stale bookings:', bookingDeleteError.message);
            } else {
                console.log(`[Cleanup] ✅ Removed ${ids.length} stale booking(s) older than ${CUTOFF_HOURS}h.`);
            }
        } catch (err: any) {
            console.error('[Cleanup] Unexpected error:', err.message);
        }
    };

    // Run once immediately on startup, then on the interval
    run();
    const timer = setInterval(run, INTERVAL_MS);

    console.log(`[Cleanup] Job started. Checks every ${INTERVAL_MS / 60000}min. Cutoff: ${CUTOFF_HOURS}h unpaid bookings.`);

    return timer; // caller can clearInterval if needed
};
