import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd'
import { useBlocker } from 'react-router-dom'
import { Search, Music, Save, AlertTriangle, Plus, ExternalLink, Trash2 } from 'lucide-react'
import { useSongsWithStats } from '@/hooks/useSongs'
import { useSunday } from '@/hooks/useSundays'
import { useComments } from '@/hooks/useComments'
import { useMultiRealtime, REALTIME, LIVE_DATA_POLL_MS } from '@/hooks/useRealtime'
import { DraggableSong } from './DraggableSong'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { getDiversityColor, getDiversityBg, formatDateLong, cn } from '@/lib/utils'
import { formatSongTitle, getDriveUrl } from '@/components/songs/SongName'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { isRlsOrAuthError } from '@/lib/supabaseErrors'
import { getUserDisplayName } from '@/lib/userDisplayName'

interface ScheduleBuilderProps {
  date: string
}

export function ScheduleBuilder({ date }: ScheduleBuilderProps) {
  const { songs: allSongs, refetch: refetchSongs } = useSongsWithStats()
  const { sunday, loading, refetch } = useSunday(date)

  const { comments, addComment, deleteComment, refetch: refetchComments } = useComments(sunday?.id)
  const { user, isApproved, isAdmin, loading: authLoading } = useAuth()
  /** Require resolved session + approved role so we never show the editor before auth finishes. */
  const canEdit = !!user && isApproved
  const [search, setSearch] = useState('')
  const [commentText, setCommentText] = useState('')

  const commentAuthorLabel = useMemo(
    () => getUserDisplayName(user) || user?.email || '',
    [user]
  )

  const [localSongIds, setLocalSongIds] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const serverSongIdsRef = useRef<string>('[]')

  const refreshScheduleData = useCallback(() => {
    void refetch()
    void refetchSongs()
    void refetchComments()
  }, [refetch, refetchSongs, refetchComments])

  useMultiRealtime(REALTIME.scheduleBuilder, refreshScheduleData, !!date, {
    pollIntervalMs: LIVE_DATA_POLL_MS,
  })

  useEffect(() => {
    if (!sunday) {
      setLocalSongIds([])
      serverSongIdsRef.current = '[]'
      return
    }
    const ids = sunday.sunday_songs.map((ss) => ss.song_id)
    serverSongIdsRef.current = JSON.stringify(ids)
    setLocalSongIds(ids)
  }, [sunday])

  const hasChanges = useMemo(
    () => canEdit && JSON.stringify(localSongIds) !== serverSongIdsRef.current,
    [localSongIds, canEdit]
  )

  // Browser tab/close warning
  useEffect(() => {
    if (!hasChanges) return
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [hasChanges])

  // In-app navigation blocker
  const blocker = useBlocker(hasChanges)

  const selectedSongIds = useMemo(() => new Set(localSongIds), [localSongIds])

  const availableSongs = useMemo(() => {
    let result = allSongs.filter(
      (s) => s.is_playable && s.is_ready && !selectedSongIds.has(s.id)
    )
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          String(s.number).includes(q)
      )
    }
    return result.sort((a, b) => b.days_since_last - a.days_since_last)
  }, [allSongs, selectedSongIds, search])

  const scheduledSongsDisplay = useMemo(() => {
    return localSongIds
      .map((songId) => allSongs.find((s) => s.id === songId))
      .filter((s): s is NonNullable<typeof s> => !!s)
  }, [localSongIds, allSongs])

  const handleDragEnd = useCallback((result: DropResult) => {
    const { source, destination, draggableId } = result
    if (!destination) return

    // Available -> Schedule: add at end
    if (source.droppableId === 'available' && destination.droppableId === 'schedule') {
      const songId = parseInt(draggableId.replace('avail-', ''), 10)
      setLocalSongIds((prev) => [...prev, songId])
      return
    }

    // Schedule -> Available: remove
    if (source.droppableId === 'schedule' && destination.droppableId === 'available') {
      setLocalSongIds((prev) => prev.filter((_, i) => i !== source.index))
      return
    }

    // Reorder within schedule
    if (source.droppableId === 'schedule' && destination.droppableId === 'schedule') {
      if (source.index === destination.index) return
      setLocalSongIds((prev) => {
        const next = [...prev]
        const [moved] = next.splice(source.index, 1)
        next.splice(destination.index, 0, moved)
        return next
      })
    }
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      let sundayId = sunday?.id

      if (!sundayId) {
        const { data: newSunday } = await supabase
          .from('sundays')
          .upsert({ date }, { onConflict: 'date' })
          .select('id')
          .single()
        if (!newSunday) throw new Error('Failed to create sunday')
        sundayId = newSunday.id
      }

      const { error: deleteErr } = await supabase
        .from('sunday_songs')
        .delete()
        .eq('sunday_id', sundayId)
      if (deleteErr) {
        console.error('Delete error:', deleteErr)
        throw deleteErr
      }

      if (localSongIds.length > 0) {
        const rows = localSongIds.map((songId, idx) => ({
          sunday_id: sundayId!,
          song_id: songId,
          position: idx + 1,
        }))
        const { error: insertErr } = await supabase
          .from('sunday_songs')
          .insert(rows)
        if (insertErr) {
          console.error('Insert error:', insertErr)
          throw insertErr
        }
      }

      await refetch()
      await refetchSongs()
      toast.success('Programação salva!')
    } catch (err) {
      console.error('Save error:', err)
      toast.error('Erro ao salvar programação')
    } finally {
      setSaving(false)
    }
  }

  const canDeleteComment = useCallback(
    (commentUserId: string | null) => {
      if (!user?.id) return false
      if (isAdmin) return true
      return !!commentUserId && commentUserId === user.id
    },
    [user?.id, isAdmin]
  )

  const handleAddComment = async () => {
    if (!commentText.trim()) return
    const author = commentAuthorLabel.trim()
    if (!author || !user?.id) {
      toast.error('Não foi possível identificar seu usuário. Atualize a página.')
      return
    }
    const { error } = await addComment(author, commentText.trim(), user.id)
    if (error) {
      if (isRlsOrAuthError(error)) {
        toast.error(
          'Não foi possível comentar: entre com uma conta autorizada ou atualize a página se a sessão expirou.'
        )
      } else {
        toast.error('Não foi possível adicionar o comentário')
      }
      return
    }
    setCommentText('')
    toast.success('Comentário adicionado')
  }

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-text-muted">Carregando...</div>
      </div>
    )
  }

  // Read-only view for public (non-approved) users
  if (!canEdit) {
    return (
      <div className="space-y-6 min-w-0 overflow-hidden">
        <div>
          <h1 className="text-2xl font-bold">Programação</h1>
          <p className="text-text-secondary mt-1">{formatDateLong(date)}</p>
        </div>

        {/* Song list */}
        <div className="rounded-xl border border-border bg-bg-card p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <Music size={18} className="text-accent-light" />
            <h2 className="text-base font-semibold">Cânticos</h2>
            <Badge variant="info">
              {scheduledSongsDisplay.length} cânticos
            </Badge>
          </div>

          {scheduledSongsDisplay.length > 0 ? (
            <div className="space-y-2">
              {scheduledSongsDisplay.map((song, index) => (
                <div
                  key={song.id}
                  className="flex items-center gap-3 rounded-lg p-3"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-light/20 text-accent-light text-xs font-bold shrink-0">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <a
                      href={getDriveUrl(song.drive_folder_id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium hover:text-accent-light transition-colors inline-flex items-center gap-1"
                    >
                      {formatSongTitle(song.number, song.name)}
                      <ExternalLink size={10} className="opacity-40 shrink-0" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-text-muted">
              <Music size={32} className="mb-2 opacity-30" />
              <p className="text-sm">Programação ainda não definida.</p>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-bg-card p-4 sm:p-5">
          <h2 className="text-base font-semibold mb-4">Comentários</h2>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {comments.map((c) => (
              <div key={c.id} className="rounded-lg bg-bg-secondary p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-accent-light">
                    {c.author}
                  </span>
                  <span className="text-xs text-text-muted">
                    {new Date(c.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <p className="text-sm text-text-secondary">{c.content}</p>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-xs text-text-muted">Nenhum comentário ainda.</p>
            )}
          </div>
          <p className="text-xs text-text-muted mt-3">
            Entre com conta autorizada para comentar.
          </p>
        </div>
      </div>
    )
  }

  // Editable view for approved users and admins
  return (
    <div className="space-y-6 min-w-0 overflow-hidden">
      {/* Navigation blocker modal */}
      {blocker.state === 'blocked' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-bg-secondary border border-border rounded-xl p-6 max-w-sm mx-4 space-y-4">
            <div className="flex items-center gap-3">
              <AlertTriangle size={24} className="text-warning shrink-0" />
              <h3 className="text-lg font-semibold">Alterações não salvas</h3>
            </div>
            <p className="text-sm text-text-secondary">
              Você tem alterações na programação que não foram salvas. Deseja sair sem salvar?
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => blocker.reset?.()}
              >
                Voltar e salvar
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => blocker.proceed?.()}
              >
                Sair sem salvar
              </Button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold">Montar Domingo</h1>
        <p className="text-text-secondary mt-1">{formatDateLong(date)}</p>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid lg:grid-cols-2 gap-6 min-w-0">
          {/* Available Songs */}
          <div className="rounded-xl border border-border bg-bg-card p-4 sm:p-5 min-w-0 overflow-hidden">
            <h2 className="text-base font-semibold mb-4">
              Cânticos Disponíveis
            </h2>
            <div className="relative mb-4">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                type="text"
                placeholder="Buscar cântico..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg-input pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent-light"
              />
            </div>
            <Droppable droppableId="available">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    'space-y-2 max-h-[210px] sm:max-h-[500px] overflow-y-auto pr-1 min-h-16 rounded-lg p-1 transition-colors',
                    snapshot.isDraggingOver && 'bg-danger/5'
                  )}
                >
                  {availableSongs.map((song, index) => (
                    <Draggable
                      key={`avail-${song.id}`}
                      draggableId={`avail-${song.id}`}
                      index={index}
                    >
                      {(dragProvided, dragSnapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          {...dragProvided.dragHandleProps}
                          className={cn(
                            'flex items-center gap-2 sm:gap-3 rounded-lg border border-transparent p-2 sm:p-3 transition-all cursor-grab active:cursor-grabbing',
                            getDiversityBg(song.days_since_last),
                            !dragSnapshot.isDragging && 'hover:bg-bg-primary',
                            dragSnapshot.isDragging && 'shadow-lg shadow-black/30 rotate-1'
                          )}
                        >
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
                            <p className="text-xs text-text-muted">
                              <span className={getDiversityColor(song.days_since_last)}>
                                {song.days_since_last >= 99999
                                  ? 'Nunca tocada'
                                  : song.days_since_last < 0
                                    ? `Em ${Math.abs(song.days_since_last)}d`
                                    : `${song.days_since_last}d`}
                              </span>
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setLocalSongIds((prev) => [...prev, song.id])
                            }}
                            className="rounded-md p-1.5 text-text-muted hover:text-success hover:bg-success/10 transition-colors cursor-pointer shrink-0"
                            title="Adicionar"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {availableSongs.length === 0 && (
                    <p className="text-sm text-text-muted text-center py-8">
                      Nenhum cântico disponível.
                    </p>
                  )}
                </div>
              )}
            </Droppable>
          </div>

          {/* Schedule Drop Zone */}
          <div className="space-y-6 min-w-0 overflow-hidden">
            <div className="rounded-xl border border-border bg-bg-card p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Music size={18} className="text-accent-light" />
                  <h2 className="text-base font-semibold">Programação</h2>
                  <Badge variant="info">
                    {scheduledSongsDisplay.length} cânticos
                  </Badge>
                </div>
                {hasChanges && (
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    <Save size={14} />
                    {saving ? 'Salvando...' : 'Salvar'}
                  </Button>
                )}
              </div>

              {hasChanges && (
                <div className="rounded-lg bg-warning/10 border border-warning/30 px-3 py-1.5 text-xs text-warning mb-3">
                  Alterações não salvas
                </div>
              )}

              <Droppable droppableId="schedule">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      'space-y-2 min-h-32 rounded-lg p-2 transition-colors',
                      snapshot.isDraggingOver && 'bg-accent-light/5'
                    )}
                  >
                    {scheduledSongsDisplay.map((song, index) => (
                      <DraggableSong
                        key={`sched-${song.id}-${index}`}
                        song={song}
                        index={index}
                        sundaySongId={song.id}
                        onRemove={() => {
                          setLocalSongIds((prev) =>
                            prev.filter((_, i) => i !== index)
                          )
                        }}
                      />
                    ))}
                    {provided.placeholder}
                    {scheduledSongsDisplay.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-text-muted">
                        <Music size={32} className="mb-2 opacity-30" />
                        <p className="text-sm">
                          Arraste cânticos da lista ou clique no +
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>

            {/* Comments */}
            <div className="rounded-xl border border-border bg-bg-card p-4 sm:p-5">
              <h2 className="text-base font-semibold mb-4">Comentários</h2>
              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {comments.map((c) => (
                  <div key={c.id} className="rounded-lg bg-bg-secondary p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-accent-light">
                          {c.author}
                        </span>
                        <span className="text-xs text-text-muted">
                          {new Date(c.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      {canDeleteComment(c.user_id) && (
                        <button
                          type="button"
                          onClick={async () => {
                            const { error } = await deleteComment(c.id)
                            if (error) {
                              if (isRlsOrAuthError(error)) {
                                toast.error(
                                  'Sem permissão ou sessão expirada. Atualize a página.'
                                )
                              } else {
                                toast.error('Não foi possível remover o comentário')
                              }
                              return
                            }
                            toast.success('Comentário removido')
                          }}
                          className="rounded p-1 text-text-muted hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                          title={
                            isAdmin
                              ? 'Remover comentário'
                              : 'Remover meu comentário'
                          }
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-text-secondary">{c.content}</p>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="text-xs text-text-muted">
                    Nenhum comentário ainda.
                  </p>
                )}
              </div>
              <p className="text-xs text-text-muted mb-2">
                Comentando como{' '}
                <span className="text-text-secondary">{commentAuthorLabel || '…'}</span>
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Escreva um comentário..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                  className="flex-1 rounded-lg border border-border bg-bg-input px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent-light"
                />
                <Button size="sm" onClick={handleAddComment}>
                  Enviar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DragDropContext>
    </div>
  )
}
