-- =============================================================
-- Canticos App - Schema V8 (Suggestions & comments: editors only)
-- Run AFTER 05 (requires is_approved_user()).
-- Replaces public SELECT/INSERT on suggestions and comments.
-- =============================================================

-- ---- Suggestions ----
DROP POLICY IF EXISTS "Public read suggestions" ON suggestions;
DROP POLICY IF EXISTS "Public insert suggestions" ON suggestions;

CREATE POLICY "Approved read suggestions" ON suggestions
  FOR SELECT TO authenticated
  USING (is_approved_user());

CREATE POLICY "Approved insert suggestions" ON suggestions
  FOR INSERT TO authenticated
  WITH CHECK (is_approved_user());

-- ---- Comments ----
DROP POLICY IF EXISTS "Public read comments" ON comments;
DROP POLICY IF EXISTS "Public insert comments" ON comments;

CREATE POLICY "Approved read comments" ON comments
  FOR SELECT TO authenticated
  USING (is_approved_user());

CREATE POLICY "Approved insert comments" ON comments
  FOR INSERT TO authenticated
  WITH CHECK (is_approved_user());

-- UPDATE/DELETE policies from migration 05 remain (approved users + admin on suggestions).
