import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Music, ExternalLink } from 'lucide-react'
import { useUpcomingSundays, useRecentSundays } from '@/hooks/useSundays'
import { useMultiRealtime, REALTIME } from '@/hooks/useRealtime'
import { formatDateLong, getNextSunday } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatSongTitle, DriveLink } from '@/components/songs/SongName'
import { format } from 'date-fns'

export function PublicHome() {
  const { sundays: upcoming, refetch: refetchUpcoming } = useUpcomingSundays(1)
  const { sundays: recent, refetch: refetchRecent } = useRecentSundays(6)

  const refreshHome = useCallback(() => {
    void refetchUpcoming()
    void refetchRecent()
  }, [refetchUpcoming, refetchRecent])

  useMultiRealtime(REALTIME.home, refreshHome, true)

  const nextSunday = getNextSunday()
  const nextSundayStr = format(nextSunday, 'yyyy-MM-dd')
  const nextSundayData = upcoming.find((s) => s.date === nextSundayStr)

  return (
    <div className="space-y-8">
      <div className="text-center py-4">
        <h1 className="text-3xl font-bold">Cânticos IP Filadelfia</h1>
        <p className="text-text-secondary mt-2">
          Cronograma semanal da IP Filadelfia - São Carlos/SP
        </p>
        <p className="mt-3 text-xs text-text-muted">
          <Link
            to="/privacidade"
            className="underline decoration-text-muted/50 underline-offset-2 hover:text-text-secondary"
          >
            Política de privacidade
          </Link>
          <span className="mx-2 text-border" aria-hidden>
            ·
          </span>
          <Link
            to="/termos"
            className="underline decoration-text-muted/50 underline-offset-2 hover:text-text-secondary"
          >
            Termos de uso
          </Link>
        </p>
      </div>

      {/* Next Sunday */}
      <div className="rounded-xl border border-accent-light/30 bg-accent-light/5 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-accent-light font-medium uppercase tracking-wider">
              Próximo Domingo
            </p>
            <p className="text-lg font-semibold mt-1">
              {formatDateLong(nextSunday)}
            </p>
          </div>
          <Link to={`/domingo/${nextSundayStr}`}>
            <Button size="sm" variant="secondary">
              Ver detalhes <ArrowRight size={14} />
            </Button>
          </Link>
        </div>

        {nextSundayData && nextSundayData.sunday_songs.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-2">
            {nextSundayData.sunday_songs.map((ss, i) => (
              <DriveLink
                key={ss.id}
                driveFolderId={ss.song.drive_folder_id}
                className="flex items-center gap-3 rounded-lg bg-bg-secondary p-3 hover:bg-bg-primary transition-colors"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-light/20 text-accent-light text-xs font-bold shrink-0">
                  {i + 1}
                </span>
                <span className="text-sm font-medium flex-1">
                  {formatSongTitle(ss.song.number, ss.song.name)}
                </span>
                <ExternalLink size={10} className="opacity-40 shrink-0" />
              </DriveLink>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 text-text-muted">
            <Music size={20} className="opacity-40" />
            <p className="text-sm">Programação ainda não definida.</p>
          </div>
        )}
      </div>

      {/* Recent Sundays */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Domingos Recentes</h2>
          <Link to="/calendario">
            <Button size="sm" variant="ghost">
              Ver calendário <ArrowRight size={14} />
            </Button>
          </Link>
        </div>
        <div className="space-y-3">
          {recent.map((s) => (
            <Link
              key={s.id}
              to={`/domingo/${s.date}`}
              className="block rounded-xl border border-border bg-bg-card p-4 hover:bg-bg-card-hover transition-colors"
            >
              <p className="text-sm font-medium mb-2">
                {formatDateLong(s.date)}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {s.sunday_songs.map((ss) => (
                  <DriveLink
                    key={ss.id}
                    driveFolderId={ss.song.drive_folder_id}
                  >
                    <Badge variant="info" className="hover:bg-accent-light/25 transition-colors cursor-pointer">
                      {formatSongTitle(ss.song.number, ss.song.name)}
                      <ExternalLink size={10} className="ml-1 opacity-50 inline" />
                    </Badge>
                  </DriveLink>
                ))}
                {s.sunday_songs.length === 0 && (
                  <span className="text-xs text-text-muted">Sem cânticos</span>
                )}
              </div>
            </Link>
          ))}
          {recent.length === 0 && (
            <p className="text-sm text-text-muted text-center py-8">
              Nenhum domingo registrado ainda.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
