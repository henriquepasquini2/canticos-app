-- =============================================================
-- Canticos App - Schema V13 (Security hardening)
-- Run AFTER 12. Idempotent / safe to re-run.
--
-- 1. Remove sensitive tables from Realtime publication to
--    prevent potential email leakage via postgres_changes.
-- 2. Add explicit admin INSERT policy on settings table.
-- =============================================================

-- ---- 1. Remove sensitive tables from Realtime publication ----
-- admins, approved_users, access_requests contain user emails.
-- Realtime postgres_changes may broadcast events before RLS
-- filtering (plan-dependent), leaking data to any subscriber.
-- The admin UI polls/refetches on demand — Realtime not needed.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public' AND tablename = 'admins'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.admins;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public' AND tablename = 'approved_users'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.approved_users;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public' AND tablename = 'access_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.access_requests;
  END IF;
END $$;

-- ---- 2. Explicit admin INSERT policy on settings ----
-- RLS is enabled; without an INSERT policy, inserts silently fail.
-- Make it explicit: only admins can insert new settings rows.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'settings' AND policyname = 'Admin insert settings'
  ) THEN
    EXECUTE 'CREATE POLICY "Admin insert settings" ON settings
      FOR INSERT TO authenticated
      WITH CHECK (is_admin())';
  END IF;
END $$;
