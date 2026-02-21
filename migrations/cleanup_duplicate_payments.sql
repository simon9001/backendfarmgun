-- =========================================================
-- Cleanup: Remove orphaned/duplicate pending payment rows
-- Run this in your Supabase SQL Editor to fix existing bad data
-- =========================================================

-- 1. Show the problem rows first (for confirmation)
SELECT 
    id, booking_id, amount, status, transaction_id, paid_at,
    ROW_NUMBER() OVER (PARTITION BY booking_id ORDER BY 
        CASE WHEN transaction_id IS NOT NULL THEN 0 ELSE 1 END, -- prefer rows with a reference
        id
    ) as row_num
FROM payments
WHERE status = 'pending';


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

-- 2. Delete duplicate pending rows keeping only the one with the reference
-- (keeps the row that has a valid transaction_id; deletes the nulls)
-- NOTE: payments table has no created_at column, so we use id as tiebreaker
DELETE FROM payments
WHERE id IN (
    SELECT id FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                PARTITION BY booking_id 
                ORDER BY 
                    CASE WHEN transaction_id IS NOT NULL THEN 0 ELSE 1 END ASC,
                    id ASC
            ) as rn
        FROM payments
        WHERE status = 'pending'
    ) ranked
    WHERE rn > 1  -- delete all but the best row per booking
);

-- 3. Also delete any pending rows for bookings that are already paid
DELETE FROM payments
WHERE status = 'pending'
AND booking_id IN (
    SELECT id FROM bookings WHERE status = 'paid'
);

-- 4. Verify results
SELECT id, booking_id, amount, status, transaction_id, paid_at 
FROM payments 
ORDER BY created_at DESC;
