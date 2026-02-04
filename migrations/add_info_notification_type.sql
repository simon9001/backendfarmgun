-- Add 'info' to notification_type enum
-- This migration adds the 'info' notification type to support general notifications

ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'info';

-- Note: In PostgreSQL, you cannot remove enum values easily.
-- If 'info' already exists, this will be skipped.
-- The enum will now support: 'booking_confirmation', 'reminder', 'payment_receipt', 'info'
