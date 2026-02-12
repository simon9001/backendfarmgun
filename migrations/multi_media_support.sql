-- 1. Add missing columns to the crops table
ALTER TABLE crops ADD COLUMN IF NOT EXISTS scientific_name TEXT;
ALTER TABLE crops ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'vegetable';
ALTER TABLE crops ADD COLUMN IF NOT EXISTS growing_season TEXT;

-- 2. Create the crop_media table to support multiple images per crop
CREATE TABLE IF NOT EXISTS crop_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crop_id UUID REFERENCES crops(id) ON DELETE CASCADE,
    media_id UUID REFERENCES media_library(id) ON DELETE CASCADE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create the project_media table to support multiple images per project
CREATE TABLE IF NOT EXISTS project_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    media_id UUID REFERENCES media_library(id) ON DELETE CASCADE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_crop_media_crop_id ON crop_media(crop_id);
CREATE INDEX IF NOT EXISTS idx_project_media_project_id ON project_media(project_id);
