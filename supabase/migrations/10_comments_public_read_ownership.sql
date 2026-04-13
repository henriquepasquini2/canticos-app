-- =============================================================
-- Canticos App - Schema V10
-- Run AFTER 09. Requires is_admin(), is_approved_user().
-- - Comments: public SELECT; insert with user_id = auth.uid();
--   admin deletes any; approved users delete only own (user_id).
-- - Suggestions: insert with user_id = auth.uid();
--   approved users DELETE own rows where status = pendente;
--   admin UPDATE/DELETE unchanged (05).
-- =============================================================

-- ---- Columns ----
ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE suggestions
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- ---- Comments: read for everyone ----
DROP POLICY IF EXISTS "Approved read comments" ON comments;

CREATE POLICY "Public read comments" ON comments
  FOR SELECT
  USING (true);

-- ---- Comments: insert must set creator ----
DROP POLICY IF EXISTS "Approved insert comments" ON comments;

CREATE POLICY "Approved insert comments" ON comments
  FOR INSERT TO authenticated
  WITH CHECK (
    is_approved_user()
    AND user_id = auth.uid()
  );

-- ---- Comments: tighten UPDATE (own or admin) ----
DROP POLICY IF EXISTS "Approved update comments" ON comments;

CREATE POLICY "Admin update comments" ON comments
  FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Author update own comments" ON comments
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND is_approved_user())
  WITH CHECK (user_id = auth.uid() AND is_approved_user());

-- ---- Comments: DELETE admin any, author own ----
DROP POLICY IF EXISTS "Approved delete comments" ON comments;

CREATE POLICY "Admin delete comments" ON comments
  FOR DELETE TO authenticated
  USING (is_admin());

CREATE POLICY "Author delete own comments" ON comments
  FOR DELETE TO authenticated
  USING (
    is_approved_user()
    AND user_id IS NOT NULL
    AND user_id = auth.uid()
  );

-- ---- Suggestions: insert must set creator ----
DROP POLICY IF EXISTS "Approved insert suggestions" ON suggestions;

CREATE POLICY "Approved insert suggestions" ON suggestions
  FOR INSERT TO authenticated
  WITH CHECK (
    is_approved_user()
    AND user_id = auth.uid()
  );

-- ---- Suggestions: editor may withdraw own pending ----
CREATE POLICY "Approved delete own pending suggestions" ON suggestions
  FOR DELETE TO authenticated
  USING (
    is_approved_user()
    AND user_id IS NOT NULL
    AND user_id = auth.uid()
    AND status = 'pendente'
  );
