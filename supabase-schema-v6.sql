-- =============================================================
-- Canticos App - Schema V6 (Access Requests Workflow)
-- Execute this SQL in the Supabase SQL Editor AFTER v5
--
-- Adds:
--   access_requests table = users request admin approval for write access
-- =============================================================

-- 1. Create access_requests table
CREATE TABLE IF NOT EXISTS access_requests (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  message TEXT,                    -- Optional justification/notes from user
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- Index for fast lookups by email and status
CREATE INDEX idx_access_requests_email ON access_requests(email);
CREATE INDEX idx_access_requests_status ON access_requests(status);

-- =============================================================
-- 2. Helper functions to check user request status
-- =============================================================

-- Check if current user has a pending request
CREATE OR REPLACE FUNCTION has_pending_request()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM access_requests
    WHERE email = auth.jwt()->>'email'
      AND status = 'pending'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Check if current user is approved (is_approved_user from v5 + new check)
-- This ensures that if someone was approved via the workflow, they're treated as approved
CREATE OR REPLACE FUNCTION is_approved_user_v6()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM admins WHERE email = auth.jwt()->>'email'
  ) OR EXISTS (
    SELECT 1 FROM approved_users WHERE email = auth.jwt()->>'email'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- =============================================================
-- 3. RLS Policies for access_requests
-- =============================================================

-- Authenticated users can read their own requests (to show status)
CREATE POLICY "User read own requests" ON access_requests
  FOR SELECT TO authenticated
  USING (email = auth.jwt()->>'email');

-- Admins can read all requests (to review/approve/deny)
CREATE POLICY "Admin read all requests" ON access_requests
  FOR SELECT TO authenticated
  USING (is_admin());

-- Authenticated users can insert their own request (one per user due to UNIQUE constraint)
CREATE POLICY "User insert request" ON access_requests
  FOR INSERT TO authenticated
  WITH CHECK (email = auth.jwt()->>'email');

-- Only admins can update requests (approve/deny)
CREATE POLICY "Admin update requests" ON access_requests
  FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Only admins can delete requests (cleanup/audit purposes)
CREATE POLICY "Admin delete requests" ON access_requests
  FOR DELETE TO authenticated
  USING (is_admin());

-- =============================================================
-- 4. Trigger to update updated_at timestamp
-- =============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_access_requests_timestamp
  BEFORE UPDATE ON access_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================
-- 5. Optional: Auto-approve workflow helper (if desired)
--    This would be called by admin UI when approving a request:
--    INSERT INTO approved_users (email, name)
--    VALUES ('user@email.com', 'Name')
--    ON CONFLICT (email) DO NOTHING;
-- =============================================================

-- Grant necessary permissions for Supabase auth users
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON access_requests TO authenticated;
