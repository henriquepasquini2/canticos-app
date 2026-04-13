import { ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

const DRIVE_ROOT_URL =
  'https://drive.google.com/drive/folders/1j2DvMakztJDxc-rwyRJFNGQ6QIEXdOAX'

export function getDriveUrl(driveFolderId: string | null | undefined): string {
  if (driveFolderId) {
    return `https://drive.google.com/drive/folders/${driveFolderId}`
  }
  return DRIVE_ROOT_URL
}

export function formatSongTitle(number: number, name: string): string {
  return `${String(number).padStart(2, '0')} - ${name}`
}

interface SongNameProps {
  number: number
  name: string
  driveFolderId?: string | null
  className?: string
  linkToDrive?: boolean
  size?: 'sm' | 'md'
}

export function SongName({
  number,
  name,
  driveFolderId,
  className,
  linkToDrive = true,
  size = 'md',
}: SongNameProps) {
  const title = formatSongTitle(number, name)

  if (linkToDrive) {
    return (
      <a
        href={getDriveUrl(driveFolderId)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'inline-flex items-center gap-1 hover:text-accent-light transition-colors',
          size === 'sm' ? 'text-xs' : 'text-sm',
          className
        )}
        title="Abrir partitura no Drive"
      >
        {title}
        <ExternalLink size={size === 'sm' ? 10 : 12} className="opacity-50 shrink-0" />
      </a>
    )
  }

  return (
    <span className={cn(size === 'sm' ? 'text-xs' : 'text-sm', className)}>
      {title}
    </span>
  )
}

export function DriveLink({
  driveFolderId,
  children,
  className,
}: {
  driveFolderId?: string | null
  children: React.ReactNode
  className?: string
}) {
  return (
    <a
      href={getDriveUrl(driveFolderId)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={cn('inline-flex items-center', className)}
    >
      {children}
    </a>
  )
}
