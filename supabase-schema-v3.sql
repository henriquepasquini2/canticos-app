-- =============================================================
-- Canticos App - Schema V3 (Drive folder links)
-- Execute this SQL in the Supabase SQL Editor AFTER v2 schema
-- =============================================================

-- Add drive_folder_id column to songs
ALTER TABLE songs ADD COLUMN IF NOT EXISTS drive_folder_id TEXT;
