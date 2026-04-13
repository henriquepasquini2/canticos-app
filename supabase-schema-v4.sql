-- =============================================================
-- Canticos App - Schema V4 (Public schedule editing)
-- Execute this SQL in the Supabase SQL Editor AFTER v3
-- =============================================================

-- Allow anon to write to sundays (create new sundays for scheduling)
DROP POLICY IF EXISTS "Auth write sundays" ON sundays;
DROP POLICY IF EXISTS "Auth update sundays" ON sundays;
DROP POLICY IF EXISTS "Auth delete sundays" ON sundays;
CREATE POLICY "Public write sundays" ON sundays FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update sundays" ON sundays FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete sundays" ON sundays FOR DELETE TO authenticated USING (true);

-- Allow anon to write to sunday_songs (add/remove/reorder songs)
DROP POLICY IF EXISTS "Auth write sunday_songs" ON sunday_songs;
DROP POLICY IF EXISTS "Auth update sunday_songs" ON sunday_songs;
DROP POLICY IF EXISTS "Auth delete sunday_songs" ON sunday_songs;
CREATE POLICY "Public write sunday_songs" ON sunday_songs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update sunday_songs" ON sunday_songs FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete sunday_songs" ON sunday_songs FOR DELETE USING (true);
