/** PostgREST / Postgres errors that usually mean missing or invalid auth vs RLS. */
export function isRlsOrAuthError(
  error: { message?: string; code?: string } | null | undefined
): boolean {
  if (!error) return false
  const m = (error.message || '').toLowerCase()
  if (m.includes('row-level security')) return true
  if (m.includes('jwt')) return true
  if (m.includes('permission denied')) return true
  if (error.code === '42501' || error.code === 'PGRST301') return true
  return false
}
