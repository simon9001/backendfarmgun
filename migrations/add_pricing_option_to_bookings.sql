-- Add the pricing_option column to bookings table
-- This column stores which pricing plan the user selected (e.g. "Virtual", "1-5 Acres")
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS pricing_option VARCHAR(255);
