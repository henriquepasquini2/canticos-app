# Changelog

All notable changes to **Cânticos** (IP Filadelfia, Brazil).  
At one point the Git history was **reset to a single initial commit** so sensitive data would not remain in commit history. The entries below **capture the evolution that existed before that squash** plus the consolidated state, for future reference.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

### Security

- Drive repertoire root URL/folder ID removed from source; configure `VITE_DRIVE_ROOT_FOLDER_URL` or `VITE_DRIVE_ROOT_FOLDER_ID` (see `.env.example`).
- Added `docs/SECURITY.md` pre-public checklist.

---

## [1.0.0] — 2026-04-13

### Added

- **React + TypeScript + Vite** app with dark theme and **IPB** church branding.
- **Supabase** backend (PostgreSQL, Auth, Realtime) for songs, Sundays, Sunday–song links, suggestions, and comments.
- **Public routes:** home (next Sunday + recent), catalog, calendar, per-Sunday view (`/domingo/:date`), song suggestions.
- **Authenticated area:** admin dashboard, full catalog, calendar, schedule builder, insights, sync, user management.
- **Three-tier access:** admin (`admins`), approved user (`approved_users`), anonymous public read.
- **Google sign-in** (Supabase Auth); messaging for users not authorized to edit.
- **Access requests** for users not yet on the allowlist — migration `06_access_requests.sql`.
- **Google Drive integration:** per-song folder links (`drive_folder_id`), configurable root folder; Sync page lists Drive folders (browser API key — restrict in Google Cloud).
- **Schedule import** from **Google Sheets CSV export** (no write-back to the sheet).
- **Schedule builder** with drag-and-drop, **Save** button, unsaved-changes banner, and **leave confirmation** (`useBlocker` with a data router).
- **Privacy** (`/privacidade`) and **Terms** (`/termos`) pages plus footer / home links (Google OAuth branding).
- SQL migrations under **`supabase/migrations/`** with numeric order (`01`–`07`) and a local README.

### Changed

- Login copy: from “admin area / leaders only” to **worship team** and **accounts authorized to edit**.
- **Calendar** (public and admin): taller grid cells when songs exist; mobile list stacks songs with larger type and clearer badges.
- **Production Vercel hostname:** `canticosipfiladelfiasc.vercel.app` (project renamed; old duplicate hostname removed).
- **Public catalog:** sortable columns; sheet links per song via Drive.
- Cards and lists use **Drive links** with external-link icons where appropriate.

### Fixed

- **`useBlocker` outside data router** — switched to `createBrowserRouter` / `RouterProvider`.
- Schedule builder crash before data finished loading (scheduled-songs filter).
- **Negative “days ago”** for future Sundays on song cards.
- **External-link icon** placement inside badges/cards.
- Access requests: graceful handling when `access_requests` table is missing (schema not applied).

### Removed

- **Writing updates back to Google Sheets** from the app (CSV **import** only remains).

### Security

- SQL samples in Git **without real admin emails or live Sheet/Drive IDs**; sensitive inserts documented for manual Supabase runs.
- Sync default URLs only via **optional env vars** (`VITE_DEFAULT_*`), not hardcoded in source.
- **Suggestion link validation:** `http:` / `https:` only (blocks `javascript:` etc.).
- **`vercel.json` headers:** HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
- **RLS (migration 05):** schedule writes for **approved authenticated** users only; sensitive song/settings changes **admin-only**; removed anonymous read on `admins`.
- **RLS (migration 07):** each authenticated user reads **only their own row** in `admins` (no full-table enumeration).
- Documented practice: **Google API key** restricted by **HTTP referrer** in production; separate dev key with `localhost` if needed.

---

## Notes

- **Migration order:** see `supabase/migrations/README.md`.
- Future releases can add `[Unreleased]` sections and dated versions as you ship.
