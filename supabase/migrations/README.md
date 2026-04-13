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

If the database already existed, do not re-run older scripts blindly — verify policies in the Supabase dashboard first.
