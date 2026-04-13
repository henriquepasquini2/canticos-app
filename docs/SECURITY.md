# Security notes

Short checklist before publishing the repo or sharing the app widely.

## Repository

| Item | Status |
|------|--------|
| `.env` in `.gitignore` | Yes — never commit real keys. |
| No live Supabase service-role key in the app | Client uses **anon** key only (RLS applies). |
| SQL migrations | No real admin emails or Sheet/Drive IDs in tracked SQL; insert via Supabase manually as documented. |
| Drive root folder ID | **Not** hardcoded in source — set `VITE_DRIVE_ROOT_FOLDER_URL` or `VITE_DRIVE_ROOT_FOLDER_ID` in Vercel / local `.env`. |

## Supabase (production)

| Item | Action |
|------|--------|
| Migration order | Run `supabase/migrations` through **`08_suggestions_comments_approved_only.sql`** when locking down suggestions/comments. |
| RLS | After **05**, anonymous users cannot edit schedules; **07** limits `admins` reads; **08** removes anonymous access to `suggestions` and `comments` (approved editors only). |
| `access_requests` | Apply **06** only if you use the access-request flow. |

## Google Cloud

| Item | Action |
|------|--------|
| Browser API key (`VITE_GOOGLE_API_KEY`) | Restrict **HTTP referrers** to your production domain (and a **separate** dev key for `localhost` if needed). |
| APIs | Restrict key to **Google Drive API** (and only what you use). |
| Quotas | Set sensible quotas/alerts in Cloud Console. |

The key is still visible inside the shipped JS bundle; restrictions limit abuse.

## App behavior (already implemented)

- Suggestion “link” field: **http/https** only (`src/lib/safeUrl.ts`).
- `vercel.json`: HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
- No `dangerouslySetInnerHTML` / `eval` in `src/`.

## Optional hardening (not required for first publish)

- Rate limiting for public inserts (e.g. Supabase Edge Function).
- Stricter Content-Security-Policy (can conflict with Supabase realtime / OAuth unless tuned).
- Move Drive metadata fetch behind a small backend if you want the Google key off the client (larger change).

## If the repo was ever public with old commits

Rotate any secret that might have appeared in history; this repo may have been squashed — still rotate if unsure.
