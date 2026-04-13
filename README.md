# Cânticos — Worship Schedule (IPB)

Web app for managing the worship music schedule for a Presbyterian Church in Brazil (IP Filadelfia, São Carlos/SP).

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a project.
2. In the **SQL Editor**, run the migrations in `supabase/migrations/` in the order listed in `supabase/migrations/README.md`, starting with `01_initial.sql`.
3. For **live updates** in the app, run migration **`11_realtime_extra_tables.sql`** (adds `songs`, `approved_users`, `access_requests`, `admins` to Realtime). Earlier migrations already add `sundays`, `sunday_songs`, `suggestions`, `comments`. Alternatively, enable the same tables under **Database → Replication** in the dashboard.

### 3. Environment variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Credentials are under **Settings → API** in the Supabase dashboard.

Optional: Google Drive sync uses `VITE_GOOGLE_API_KEY` and optional `VITE_DEFAULT_*` URLs — see `.env.example`.

Set **`VITE_DRIVE_ROOT_FOLDER_URL`** or **`VITE_DRIVE_ROOT_FOLDER_ID`** so catalog / song links without a per-song folder still open your church’s Drive root (not committed in source).

### 4. Migrate existing data

To import catalog and history from `.txt` files:

```bash
npx tsx scripts/migrate-data.ts
```

Data files (`canticos.txt`, `cantados_*.txt`) should live in the parent folder (`../`).

### 5. Development server

```bash
npm run dev
```

## Features

- **Dashboard** — Next Sunday, stats, recent summaries (admin).
- **Catalog** — All songs with filters, search, and play history.
- **Calendar** — Month view with navigation.
- **Schedule builder** — Drag-and-drop to build each Sunday’s lineup.
- **Suggestions** — Public list at `/sugestoes` (editors submit here); same page at `/admin/sugestoes` inside the admin shell for administrators only.
- **Insights** — Diversity, “forgotten” songs, most played, etc. (admin).
- **Realtime** — Changes propagate to connected clients.
- **Comments** — Per-Sunday discussion threads.

## Tech stack

- React + TypeScript + Vite
- Tailwind CSS v4 (dark theme)
- Supabase (PostgreSQL + Realtime + Auth)
- @hello-pangea/dnd
- date-fns, Lucide React, Sonner

## Documentation

- [CHANGELOG.md](./CHANGELOG.md) — release notes and historical summary
- [supabase/migrations/README.md](./supabase/migrations/README.md) — database migration order
