import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Library,
  Music,
  Clock,
  AlertTriangle,
  CalendarPlus,
  ArrowRight,
  ExternalLink,
} from 'lucide-react'
import { useSongStats } from '@/hooks/useSongs'
import { useUpcomingSundays } from '@/hooks/useSundays'
import { useSuggestions } from '@/hooks/useSuggestions'
import { useMultiRealtime, REALTIME, LIVE_DATA_POLL_MS } from '@/hooks/useRealtime'
import { formatDateLong, getNextSunday } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatSongTitle, DriveLink } from '@/components/songs/SongName'
import { format } from 'date-fns'

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType
  label: string
  value: number | string
  color: string
}) {
  return (
    <div className="rounded-xl border border-border bg-bg-card p-5">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-text-muted">{label}</p>
        </div>
      </div>
    </div>
  )
}

export function Dashboard() {
  const stats = useSongStats()
  const { sundays: upcoming, refetch: refetchUpcoming } = useUpcomingSundays(5)
  const { pendingCount, refetch: refetchSuggestions } = useSuggestions()

  const refreshDashboard = useCallback(() => {
    void stats.refetch()
    void refetchUpcoming()
    void refetchSuggestions()
  }, [
    stats.refetch,
    refetchUpcoming,
    refetchSuggestions,
  ])

  useMultiRealtime(REALTIME.dashboard, refreshDashboard, true, {
    pollIntervalMs: LIVE_DATA_POLL_MS,
  })

  const nextSunday = getNextSunday()
  const nextSundayStr = format(nextSunday, 'yyyy-MM-dd')
  const nextSundayData = upcoming.find((s) => s.date === nextSundayStr)
  const followingSundays = upcoming.filter((s) => s.date > nextSundayStr).slice(0, 4)

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-text-secondary mt-1">
          Visão geral do louvor
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Library}
          label="Repertório total"
          value={stats.total}
          color="bg-accent-light/15 text-accent-light"
        />
        <StatCard
          icon={Music}
          label="Tocáveis"
          value={stats.playableCount}
          color="bg-success/15 text-success"
        />
        <StatCard
          icon={Clock}
          label="Nunca tocadas"
          value={stats.neverPlayedCount}
          color="bg-warning/15 text-warning"
        />
        <StatCard
          icon={AlertTriangle}
          label="Esquecidas (+1 ano)"
          value={stats.forgottenCount}
          color="bg-danger/15 text-danger"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Próximo Domingo</h2>
            <Link to={`/admin/domingo/${nextSundayStr}`}>
              <Button size="sm" variant="secondary">
                <CalendarPlus size={14} />
                Editar
              </Button>
            </Link>
          </div>
          <p className="text-sm text-text-secondary mb-4">
            {formatDateLong(nextSunday)}
          </p>
          {nextSundayData && nextSundayData.sunday_songs.length > 0 ? (
            <div className="space-y-2">
              {nextSundayData.sunday_songs.map((ss, i) => (
                <DriveLink
                  key={ss.id}
                  driveFolderId={ss.song.drive_folder_id}
                  className="flex items-center gap-3 rounded-lg bg-bg-secondary p-3 hover:bg-bg-primary transition-colors"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-light/20 text-accent-light text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium flex-1">
                    {formatSongTitle(ss.song.number, ss.song.name)}
                  </span>
                </DriveLink>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">
              Nenhum cântico planejado ainda.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-border bg-bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Domingos Seguintes</h2>
            <Link to="/admin/calendario">
              <Button size="sm" variant="ghost">
                Ver todos <ArrowRight size={14} />
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {followingSundays.map((s) => (
              <Link
                key={s.id}
                to={`/admin/domingo/${s.date}`}
                className="block rounded-lg bg-bg-secondary p-3 hover:bg-bg-primary transition-colors"
              >
                <p className="text-sm font-medium mb-1">
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
                    <span className="text-xs text-text-muted">
                      Sem cânticos
                    </span>
                  )}
                </div>
              </Link>
            ))}
            {followingSundays.length === 0 && (
              <p className="text-sm text-text-muted">
                Nenhum domingo agendado.
              </p>
            )}
          </div>
        </div>
      </div>

      {pendingCount > 0 && (
        <Link
          to="/admin/sugestoes"
          className="block rounded-xl border border-warning/30 bg-warning/5 p-5 hover:bg-warning/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/15">
              <AlertTriangle size={20} className="text-warning" />
            </div>
            <div>
              <p className="font-medium">
                {pendingCount} sugestão(ões) pendente(s)
              </p>
              <p className="text-sm text-text-secondary">
                Clique para revisar as sugestões de novas músicas
              </p>
            </div>
          </div>
        </Link>
      )}
    </div>
  )
}
