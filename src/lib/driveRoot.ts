/**
 * Fallback URL when a song has no `drive_folder_id` (e.g. header link to full repertoire folder).
 * Set in .env / Vercel so the repo does not need to embed a real folder ID.
 *
 * Prefer full URL, or folder ID only.
 */
export function getDriveRootUrl(): string {
  const full = import.meta.env.VITE_DRIVE_ROOT_FOLDER_URL?.trim()
  if (full) return full
  const id = import.meta.env.VITE_DRIVE_ROOT_FOLDER_ID?.trim()
  if (id) return `https://drive.google.com/drive/folders/${id}`
  return 'https://drive.google.com'
}
