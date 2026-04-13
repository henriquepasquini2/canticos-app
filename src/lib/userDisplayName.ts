import type { User } from '@supabase/supabase-js'

/** Display name from OAuth metadata (e.g. Google), or email, or fallback. */
export function getUserDisplayName(user: User | null | undefined): string {
  if (!user) return ''
  const meta = user.user_metadata
  const fromMeta =
    (typeof meta?.full_name === 'string' && meta.full_name.trim()) ||
    (typeof meta?.name === 'string' && meta.name.trim()) ||
    (typeof meta?.display_name === 'string' && meta.display_name.trim())
  return fromMeta || user.email?.trim() || ''
}
