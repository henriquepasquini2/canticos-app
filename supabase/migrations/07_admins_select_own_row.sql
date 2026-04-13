-- =============================================================
-- Canticos App - Schema V7 (Admins: no enumeration by authed users)
-- Execute AFTER v5/v6. Replaces broad SELECT on admins.
-- =============================================================

DROP POLICY IF EXISTS "Auth read admins" ON admins;

-- Cada usuário autenticado só lê a linha em que o email bate com o JWT.
-- O checkRole no app usa .eq('email', email) — continua funcionando.
CREATE POLICY "Auth read own admin row" ON admins
  FOR SELECT TO authenticated
  USING (email = (auth.jwt() ->> 'email'));
