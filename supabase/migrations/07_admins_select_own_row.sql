-- =============================================================
-- Canticos App - Schema V7 (Admins: no enumeration by authed users)
-- Execute AFTER v5/v6. Replaces broad SELECT on admins.
-- =============================================================

DROP POLICY IF EXISTS "Auth read admins" ON admins;

-- Each authenticated user only reads the row where email matches the JWT.
-- App checkRole uses .eq('email', email) — still works.
CREATE POLICY "Auth read own admin row" ON admins
  FOR SELECT TO authenticated
  USING (email = (auth.jwt() ->> 'email'));
