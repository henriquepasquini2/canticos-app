-- =============================================================
-- Canticos App - Schema V9
-- Run AFTER 08 (requires is_admin()).
-- - Suggestions: public read (everyone), insert still approved-only (08).
-- - admins: admins can SELECT all rows (Users page); others keep own-row only (07).
-- =============================================================

-- ---- Suggestions: anyone can read ----
DROP POLICY IF EXISTS "Approved read suggestions" ON suggestions;

CREATE POLICY "Public read suggestions" ON suggestions
  FOR SELECT
  USING (true);

-- ---- Admins: full list for admin UI ----
CREATE POLICY "Admin read all admins" ON admins
  FOR SELECT TO authenticated
  USING (is_admin());
