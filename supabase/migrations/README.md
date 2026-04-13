# Migrações SQL (Supabase)

Execute no **SQL Editor** do projeto Supabase, **nesta ordem** (uma vez por ambiente, ou só as que ainda não aplicaste):

| Ordem | Ficheiro | Notas |
|------:|----------|--------|
| 1 | `01_initial.sql` | Tabelas base + RLS inicial |
| 2 | `02_auth_settings.sql` | Admins, settings — inserir dados sensíveis manualmente (comentários no ficheiro) |
| 3 | `03_drive_folder_id.sql` | Coluna `drive_folder_id` em `songs` |
| 4 | `04_public_schedule_write.sql` | Escrita pública no cronograma (supersedido pelo 05 se o correres) |
| 5 | `05_three_tier_access.sql` | Acesso admin / aprovado / leitura pública |
| 6 | `06_access_requests.sql` | Pedidos de acesso (opcional) |
| 7 | `07_admins_select_own_row.sql` | `admins`: cada user só vê a própria linha |

Se o projeto já existia, não voltes a correr scripts antigos sem verificar políticas no dashboard.
