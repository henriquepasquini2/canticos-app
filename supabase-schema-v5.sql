-- =============================================================
-- Canticos App - Schema V5 (3-tier access control)
-- Execute this SQL in the Supabase SQL Editor AFTER v4
--
-- Roles:
--   admin           = full access (manage users, sync, toggle songs, etc.)
--   approved user   = write access (edit schedules, add comments)
--   public (anon)   = read-only  (view everything, submit suggestions)
-- =============================================================

-- 1. Create approved_users table
CREATE TABLE IF NOT EXISTS approved_users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE approved_users ENABLE ROW LEVEL SECURITY;

-- 2. Helper functions (SECURITY DEFINER bypasses RLS so policies can call them)

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM admins WHERE email = auth.jwt()->>'email'
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_approved_user()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM admins WHERE email = auth.jwt()->>'email'
  ) OR EXISTS (
    SELECT 1 FROM approved_users WHERE email = auth.jwt()->>'email'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- =============================================================
-- 3. approved_users RLS
-- =============================================================
CREATE POLICY "Auth read approved_users" ON approved_users
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert approved_users" ON approved_users
  FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "Admin delete approved_users" ON approved_users
  FOR DELETE TO authenticated USING (is_admin());

-- =============================================================
-- 4. Tighten admins table: remove anonymous read
-- =============================================================
DROP POLICY IF EXISTS "Anon read admins" ON admins;
-- Auth read stays: authenticated users can check admin status

-- =============================================================
-- 5. Songs: public read, admin-only write
-- =============================================================
DROP POLICY IF EXISTS "Auth write songs" ON songs;
DROP POLICY IF EXISTS "Auth update songs" ON songs;
DROP POLICY IF EXISTS "Auth delete songs" ON songs;
CREATE POLICY "Admin write songs" ON songs
  FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "Admin update songs" ON songs
  FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin delete songs" ON songs
  FOR DELETE TO authenticated USING (is_admin());

-- =============================================================
-- 6. Sundays: public read, approved users write, admin delete
-- =============================================================
DROP POLICY IF EXISTS "Public write sundays" ON sundays;
DROP POLICY IF EXISTS "Public update sundays" ON sundays;
DROP POLICY IF EXISTS "Auth write sundays" ON sundays;
DROP POLICY IF EXISTS "Auth update sundays" ON sundays;
DROP POLICY IF EXISTS "Auth delete sundays" ON sundays;
CREATE POLICY "Approved write sundays" ON sundays
  FOR INSERT TO authenticated WITH CHECK (is_approved_user());
CREATE POLICY "Approved update sundays" ON sundays
  FOR UPDATE TO authenticated USING (is_approved_user()) WITH CHECK (is_approved_user());
CREATE POLICY "Admin delete sundays" ON sundays
  FOR DELETE TO authenticated USING (is_admin());

-- =============================================================
-- 7. Sunday_songs: public read, approved users write/delete
-- =============================================================
DROP POLICY IF EXISTS "Public write sunday_songs" ON sunday_songs;
DROP POLICY IF EXISTS "Public update sunday_songs" ON sunday_songs;
DROP POLICY IF EXISTS "Public delete sunday_songs" ON sunday_songs;
DROP POLICY IF EXISTS "Auth write sunday_songs" ON sunday_songs;
DROP POLICY IF EXISTS "Auth update sunday_songs" ON sunday_songs;
DROP POLICY IF EXISTS "Auth delete sunday_songs" ON sunday_songs;
CREATE POLICY "Approved write sunday_songs" ON sunday_songs
  FOR INSERT TO authenticated WITH CHECK (is_approved_user());
CREATE POLICY "Approved update sunday_songs" ON sunday_songs
  FOR UPDATE TO authenticated USING (is_approved_user()) WITH CHECK (is_approved_user());
CREATE POLICY "Approved delete sunday_songs" ON sunday_songs
  FOR DELETE TO authenticated USING (is_approved_user());

-- =============================================================
-- 8. Suggestions: public read + insert, admin-only update/delete
--    (v2 already had auth update/delete - tighten to admin)
-- =============================================================
DROP POLICY IF EXISTS "Auth update suggestions" ON suggestions;
DROP POLICY IF EXISTS "Auth delete suggestions" ON suggestions;
CREATE POLICY "Admin update suggestions" ON suggestions
  FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin delete suggestions" ON suggestions
  FOR DELETE TO authenticated USING (is_admin());

-- =============================================================
-- 9. Comments: public read + insert, approved users delete
--    (admin can delete any; approved users can also delete)
-- =============================================================
DROP POLICY IF EXISTS "Auth update comments" ON comments;
DROP POLICY IF EXISTS "Auth delete comments" ON comments;
CREATE POLICY "Approved update comments" ON comments
  FOR UPDATE TO authenticated USING (is_approved_user()) WITH CHECK (is_approved_user());
CREATE POLICY "Approved delete comments" ON comments
  FOR DELETE TO authenticated USING (is_approved_user());

-- =============================================================
-- 10. Settings: admin-only write (was authenticated)
-- =============================================================
DROP POLICY IF EXISTS "Auth update settings" ON settings;
CREATE POLICY "Admin update settings" ON settings
  FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
