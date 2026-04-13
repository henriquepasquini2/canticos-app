/** Only http(s) URLs — blocks javascript:, data:, etc. */
export function isSafeHttpUrl(url: string): boolean {
  const t = url.trim()
  if (!t) return false
  try {
    const u = new URL(t)
    return u.protocol === 'https:' || u.protocol === 'http:'
  } catch {
    return false
  }
}
