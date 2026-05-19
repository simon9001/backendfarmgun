/**
 * CLEANUP JOB — runs every 30 minutes.
 * Deletes unpaid bookings older than 24 hours so the slots free up again.
 *
 * Logic:
 *  1. Find bookings with status = 'pending' and created_at < NOW() - 24h
 *  2. Delete their associated pending payment rows
 *  3. Delete the bookings
 */
export declare const startCleanupJob: () => NodeJS.Timeout;
//# sourceMappingURL=cleanupJob.d.ts.map