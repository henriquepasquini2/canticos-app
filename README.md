# Cânticos — Worship Schedule (IPB)

Web app for managing the worship music schedule for a Presbyterian Church in Brazil (IP Filadelfia, São Carlos/SP).

Currently running on: https://canticosipfiladelfiasc.vercel.app/

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

## Repository and Vercel (Git)

Source repository: **[github.com/henriquepasquini2/canticos-app](https://github.com/henriquepasquini2/canticos-app)** (public). Default branch: `master`.

### Link this repo to an existing Vercel project

The Vercel CLI (`npx vercel git connect …`) only succeeds after the **Vercel** GitHub App can access the repository.

1. **GitHub** (account that owns the repo) → **Settings** → **Applications** → **Installed GitHub Apps** → **Vercel** → **Configure**.
2. Under **Repository access**, choose **Only select repositories** and include **`canticos-app`** (or *All repositories* if you accept that).
3. **Vercel** → your project → **Settings** → **Git** → **Connect Git Repository** → pick `henriquepasquini2/canticos-app`, production branch **`master`**, root **`.`** (repo root is the app).

Alternatively, from this directory after step 1–2:

```bash
npx vercel git connect https://github.com/henriquepasquini2/canticos-app.git
```

Pushes to `master` then trigger production deploys (and branch/PR previews if enabled).

### Environment variables on Vercel

Set under **Settings → Environment Variables** (at least **Production**): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, plus optional `VITE_GOOGLE_API_KEY`, `VITE_DRIVE_ROOT_FOLDER_ID` / URL, etc. — see **Environment variables** above. Do **not** set `SUPABASE_SERVICE_ROLE_KEY` on Vercel for this SPA. For **Preview** deploys, duplicate the same `VITE_*` keys for the Preview environment if you use PR previews.

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
