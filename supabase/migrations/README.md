# Supabase SQL migrations

Run these in the Supabase **SQL Editor** for your project, **in this order** (once per environment, or only scripts you have not applied yet).

| Step | File | Description |
|-----:|------|-------------|
| 1 | `01_initial.sql` | Base tables + initial RLS |
| 2 | `02_auth_settings.sql` | Admins, settings — insert sensitive data manually (see comments in file) |
| 3 | `03_drive_folder_id.sql` | Adds `drive_folder_id` on `songs` |
| 4 | `04_public_schedule_write.sql` | Anonymous schedule writes (superseded by step 5 if you run it) |
| 5 | `05_three_tier_access.sql` | Admin / approved / public read model |
| 6 | `06_access_requests.sql` | Access request workflow (optional) |
| 7 | `07_admins_select_own_row.sql` | `admins`: each user sees only their own row |
| 8 | `08_suggestions_comments_approved_only.sql` | Suggestions & comments: no anonymous access; approved editors + admins only |
| 9 | `09_public_suggestions_read_admin_list.sql` | Suggestions: public `SELECT`; admins can list all rows in `admins` |
| 10 | `10_comments_public_read_ownership.sql` | Comments public read + `user_id`; delete own / admin any; suggestions own pending delete |
| 11 | `11_realtime_extra_tables.sql` | Realtime: add `songs`, `approved_users`, `access_requests`, `admins` to `supabase_realtime` (01 already adds the rest) |
| 12 | `12_ensure_core_tables_realtime_publication.sql` | Realtime: ensure `sundays`, `sunday_songs`, `suggestions`, `comments` are in `supabase_realtime` (run if live updates never arrive) |

If the database already existed, do not re-run older scripts blindly — verify policies in the Supabase dashboard first.
