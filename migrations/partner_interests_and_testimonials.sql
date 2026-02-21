-- =============================================
-- Migration: Partner Interests & Testimonial Updates
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. Create partnership_type enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE partnership_type AS ENUM (
    'sponsorship', 'co-branding', 'equipment', 'funding', 'mentorship', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Create partner_interest_status enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE partner_interest_status AS ENUM (
    'pending', 'reviewed', 'proposal_requested', 'evaluated',
    'negotiating', 'approved', 'declined'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Create partner_interests table
CREATE TABLE IF NOT EXISTS partner_interests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    partnership_type partnership_type NOT NULL,
    budget_resources TEXT NOT NULL,
    interest_reason TEXT NOT NULL,
    status partner_interest_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Auto-update timestamps for partner_interests
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_partner_interests_updated_at
BEFORE UPDATE ON partner_interests
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Disable RLS on partner_interests (backend uses service key, no RLS needed)
ALTER TABLE partner_interests DISABLE ROW LEVEL SECURITY;

-- 6. Grant full access to service role
GRANT ALL ON partner_interests TO service_role;
GRANT ALL ON partner_interests TO authenticated;
GRANT ALL ON partner_interests TO anon;

-- 7. Add user_id column to testimonials if it doesn't exist
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- 8. Create an index for faster lookup
CREATE INDEX IF NOT EXISTS idx_partner_interests_status ON partner_interests(status);
CREATE INDEX IF NOT EXISTS idx_testimonials_user_id ON testimonials(user_id);

-- Verify
SELECT 'partner_interests table created successfully' AS status;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'partner_interests' ORDER BY ordinal_position;
