-- =========================================================
-- Migration: Add unique index for pending payments
-- Prevents race conditions where multiple STK pushes are triggered
-- =========================================================

-- First, cleanup any existing duplicates just in case
DELETE FROM payments
WHERE id IN (
    SELECT id FROM (
        SELECT id,
            ROW_NUMBER() OVER (PARTITION BY booking_id 
                ORDER BY CASE WHEN transaction_id IS NOT NULL THEN 0 ELSE 1 END ASC, id ASC
            ) as rn
        FROM payments WHERE status = 'pending'
    ) ranked WHERE rn > 1
);

-- Add the unique index
CREATE UNIQUE INDEX IF NOT EXISTS unique_pending_payment_per_booking 
ON payments (booking_id) 
WHERE status = 'pending';
