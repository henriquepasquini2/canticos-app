import { Draggable } from '@hello-pangea/dnd'
import { GripVertical, X, ExternalLink } from 'lucide-react'
import { getDiversityBg, cn } from '@/lib/utils'
import { formatSongTitle, getDriveUrl } from '@/components/songs/SongName'
import type { SongWithStats } from '@/lib/types'

interface DraggableSongProps {
  song: SongWithStats
  index: number
  sundaySongId: number
  onRemove: () => void
}

export function DraggableSong({
  song,
  index,
  sundaySongId,
  onRemove,
}: DraggableSongProps) {
  const days = song.days_since_last ?? 99999

  return (
    <Draggable draggableId={`sched-${sundaySongId}-${index}`} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={cn(
            'flex items-center gap-2 sm:gap-3 rounded-lg border p-2 sm:p-3 transition-all',
            getDiversityBg(days),
            snapshot.isDragging && 'shadow-lg shadow-black/30 rotate-1'
          )}
        >
          <div
            {...provided.dragHandleProps}
            className="cursor-grab active:cursor-grabbing text-text-muted hover:text-text-primary shrink-0"
          >
            <GripVertical size={18} />
          </div>
          <span className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-bg-secondary text-xs font-bold shrink-0">
            {index + 1}
          </span>
          <div className="flex-1 min-w-0 overflow-hidden">
            <a
              href={getDriveUrl(song.drive_folder_id)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-sm font-medium hover:text-accent-light transition-colors flex items-center gap-1 min-w-0"
            >
              <span className="truncate">
                {formatSongTitle(song.number, song.name)}
              </span>
              <ExternalLink size={10} className="opacity-40 shrink-0" />
            </a>
            <p className="text-xs text-text-muted truncate">
              {days >= 99999
                ? 'Nunca tocada'
                : days < 0
                  ? `Planejada (em ${Math.abs(days)} dias)`
                  : days === 0
                    ? 'Hoje'
                    : `${days} dias atrás`}
            </p>
          </div>
          <button
            onClick={onRemove}
            className="rounded-md p-1 text-text-muted hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </Draggable>
  )
}
