-- =============================================================
-- Canticos App - Schema V2 (Auth + Access Control)
-- Execute this SQL in the Supabase SQL Editor AFTER v1 schema
-- =============================================================

-- 1. Admins table
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL
);

-- Sensitive data (admin emails, Sheet/Drive IDs) must not live in Git.
-- Insert manually in Supabase → SQL Editor, for example:
--
-- INSERT INTO admins (email) VALUES ('you@example.com') ON CONFLICT (email) DO NOTHING;
--
-- INSERT INTO settings (key, value) VALUES
--   ('sheets_url', 'https://docs.google.com/spreadsheets/d/YOUR_ID/export?format=csv&gid=...'),
--   ('drive_folder_id', 'YOUR_DRIVE_FOLDER_ID')
-- ON CONFLICT (key) DO NOTHING;

-- 2. Settings table
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- =============================================================
-- Update RLS Policies
-- Drop old permissive policies first, then create new ones
-- =============================================================

-- Songs: public read, authenticated write
DROP POLICY IF EXISTS "Allow all on songs" ON songs;
CREATE POLICY "Public read songs" ON songs FOR SELECT USING (true);
CREATE POLICY "Auth write songs" ON songs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update songs" ON songs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete songs" ON songs FOR DELETE TO authenticated USING (true);

-- Sundays: public read, authenticated write
DROP POLICY IF EXISTS "Allow all on sundays" ON sundays;
CREATE POLICY "Public read sundays" ON sundays FOR SELECT USING (true);
CREATE POLICY "Auth write sundays" ON sundays FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update sundays" ON sundays FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete sundays" ON sundays FOR DELETE TO authenticated USING (true);

-- Sunday_songs: public read, authenticated write
DROP POLICY IF EXISTS "Allow all on sunday_songs" ON sunday_songs;
CREATE POLICY "Public read sunday_songs" ON sunday_songs FOR SELECT USING (true);
CREATE POLICY "Auth write sunday_songs" ON sunday_songs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update sunday_songs" ON sunday_songs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete sunday_songs" ON sunday_songs FOR DELETE TO authenticated USING (true);

-- Suggestions: public read + insert, authenticated update/delete
DROP POLICY IF EXISTS "Allow all on suggestions" ON suggestions;
CREATE POLICY "Public read suggestions" ON suggestions FOR SELECT USING (true);
CREATE POLICY "Public insert suggestions" ON suggestions FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth update suggestions" ON suggestions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete suggestions" ON suggestions FOR DELETE TO authenticated USING (true);

-- Comments: public read + insert, authenticated update/delete
DROP POLICY IF EXISTS "Allow all on comments" ON comments;
CREATE POLICY "Public read comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Public insert comments" ON comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth update comments" ON comments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete comments" ON comments FOR DELETE TO authenticated USING (true);

-- Admins: authenticated read only
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read admins" ON admins FOR SELECT TO authenticated USING (true);
-- Also allow anon to check (needed for useAuth admin check before full auth loads)
CREATE POLICY "Anon read admins" ON admins FOR SELECT TO anon USING (true);

-- Settings: authenticated read/write
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read settings" ON settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth update settings" ON settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
