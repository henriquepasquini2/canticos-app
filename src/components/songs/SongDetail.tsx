import { useState } from 'react'
import { FolderOpen } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import { formatSongTitle, getDriveUrl } from '@/components/songs/SongName'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { SongWithStats } from '@/lib/types'

interface SongDetailProps {
  song: SongWithStats | null
  open: boolean
  onClose: () => void
  onUpdate?: () => void
}

export function SongDetail({ song, open, onClose, onUpdate }: SongDetailProps) {
  const { isAdmin } = useAuth()
  const [updating, setUpdating] = useState(false)

  if (!song) return null

  const togglePlayable = async () => {
    setUpdating(true)
    const { error } = await supabase
      .from('songs')
      .update({ is_playable: !song.is_playable })
      .eq('id', song.id)
    if (error) {
      toast.error('Erro ao atualizar')
    } else {
      toast.success(song.is_playable ? 'Marcado como "Não tocar"' : 'Marcado como "Tocável"')
      onUpdate?.()
    }
    setUpdating(false)
  }

  const toggleReady = async () => {
    setUpdating(true)
    const { error } = await supabase
      .from('songs')
      .update({ is_ready: !song.is_ready })
      .eq('id', song.id)
    if (error) {
      toast.error('Erro ao atualizar')
    } else {
      toast.success(song.is_ready ? 'Marcado como "A preparar"' : 'Marcado como "Pronta"')
      onUpdate?.()
    }
    setUpdating(false)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={formatSongTitle(song.number, song.name)}
    >
      <div className="space-y-6">
        <a
          href={getDriveUrl(song.drive_folder_id)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-accent-light/10 border border-accent-light/20 px-3 py-2 text-sm text-accent-light hover:bg-accent-light/20 transition-colors"
        >
          <FolderOpen size={16} />
          Ver partitura no Drive
        </a>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-bg-primary p-4">
            <p className="text-xs text-text-muted mb-1">Total de execuções</p>
            <p className="text-xl font-bold">{song.executions}</p>
          </div>
          <div className="rounded-lg bg-bg-primary p-4">
            <p className="text-xs text-text-muted mb-1">Última vez tocada</p>
            <p className="text-sm font-medium">
              {song.last_played
                ? formatDate(song.last_played)
                : 'Nunca tocada'}
            </p>
          </div>
          <div className="rounded-lg bg-bg-primary p-4">
            <p className="text-xs text-text-muted mb-1">Dias desde última</p>
            <p className="text-sm font-medium">
              {song.days_since_last >= 99999
                ? '--'
                : `${song.days_since_last} dias`}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-text-muted">Status</p>
          <div className="flex gap-2 flex-wrap">
            {isAdmin ? (
              <>
                <button
                  onClick={togglePlayable}
                  disabled={updating}
                  className="cursor-pointer"
                >
                  <Badge variant={song.is_playable ? 'success' : 'danger'}>
                    {song.is_playable ? 'Tocável em culto' : 'Não tocar em culto'}
                  </Badge>
                </button>
                <button
                  onClick={toggleReady}
                  disabled={updating}
                  className="cursor-pointer"
                >
                  <Badge variant={song.is_ready ? 'success' : 'warning'}>
                    {song.is_ready ? 'Pronta' : 'A preparar'}
                  </Badge>
                </button>
              </>
            ) : (
              <>
                <Badge variant={song.is_playable ? 'success' : 'danger'}>
                  {song.is_playable ? 'Tocável em culto' : 'Não tocar em culto'}
                </Badge>
                <Badge variant={song.is_ready ? 'success' : 'warning'}>
                  {song.is_ready ? 'Pronta' : 'A preparar'}
                </Badge>
              </>
            )}
          </div>
          {isAdmin && (
            <p className="text-[10px] text-text-muted">
              Clique no status para alterar
            </p>
          )}
        </div>

        {song.notes && (
          <div>
            <p className="text-xs text-text-muted mb-1">Notas</p>
            <p className="text-sm">{song.notes}</p>
          </div>
        )}

        <div>
          <p className="text-sm font-medium mb-3">
            Histórico de execuções ({song.dates_played.length})
          </p>
          {song.dates_played.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
              {[...song.dates_played].reverse().map((date, i) => (
                <div
                  key={i}
                  className="rounded-lg bg-bg-primary px-3 py-2 text-center text-xs"
                >
                  {formatDate(date)}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">
              Nenhuma execução registrada.
            </p>
          )}
        </div>
      </div>
    </Modal>
  )
}
