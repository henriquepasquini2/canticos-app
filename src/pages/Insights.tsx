import { useMemo, useState } from 'react'
import {
  Clock,
  TrendingUp,
  AlertTriangle,
  Music,
  Ban,
  Wrench,
} from 'lucide-react'
import { useSongsWithStats } from '@/hooks/useSongs'
import { formatDate, getDiversityColor, cn } from '@/lib/utils'
import { formatSongTitle } from '@/components/songs/SongName'
import { FORGOTTEN_DAYS } from '@/lib/constants'

type InsightView =
  | 'forgotten'
  | 'most_played'
  | 'never_played'
  | 'not_playable'
  | 'not_ready'
  | 'recently_played'

export function Insights() {
  const { songs, loading } = useSongsWithStats()
  const [view, setView] = useState<InsightView>('forgotten')

  const data = useMemo(() => {
    const playable = songs.filter((s) => s.is_playable && s.is_ready)

    return {
      forgotten: playable
        .filter(
          (s) => s.days_since_last > FORGOTTEN_DAYS && s.days_since_last < 99999
        )
        .sort((a, b) => b.days_since_last - a.days_since_last),
      most_played: [...playable]
        .filter((s) => s.executions > 0)
        .sort((a, b) => b.executions - a.executions),
      never_played: playable.filter((s) => s.executions === 0),
      not_playable: songs.filter((s) => !s.is_playable),
      not_ready: songs.filter((s) => !s.is_ready),
      recently_played: playable
        .filter((s) => s.days_since_last <= 60 && s.days_since_last < 99999)
        .sort((a, b) => a.days_since_last - b.days_since_last),
    }
  }, [songs])

  const viewOptions = [
    {
      value: 'forgotten',
      label: 'Esquecidas',
      count: data.forgotten.length,
    },
    {
      value: 'most_played',
      label: 'Mais tocadas',
      count: data.most_played.length,
    },
    {
      value: 'never_played',
      label: 'Nunca tocadas',
      count: data.never_played.length,
    },
    {
      value: 'recently_played',
      label: 'Recentes',
      count: data.recently_played.length,
    },
    {
      value: 'not_playable',
      label: 'Não tocar',
      count: data.not_playable.length,
    },
    {
      value: 'not_ready',
      label: 'A preparar',
      count: data.not_ready.length,
    },
  ]

  const currentData = data[view]

  const viewIcons: Record<InsightView, React.ElementType> = {
    forgotten: Clock,
    most_played: TrendingUp,
    never_played: AlertTriangle,
    not_playable: Ban,
    not_ready: Wrench,
    recently_played: Music,
  }

  const viewDescriptions: Record<InsightView, string> = {
    forgotten: `Músicas tocáveis que não são tocadas há mais de ${FORGOTTEN_DAYS} dias`,
    most_played: 'Ranking das músicas com mais execuções no histórico',
    never_played: 'Músicas que estão no catálogo mas nunca foram tocadas',
    recently_played: 'Músicas tocadas nos últimos 60 dias',
    not_playable: 'Músicas marcadas como inadequadas para momento de culto',
    not_ready: 'Músicas que ainda precisam ser preparadas pela equipe',
  }

  const Icon = viewIcons[view]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-text-muted">
          Carregando insights...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Insights</h1>
        <p className="text-text-secondary mt-1">
          Análise do repertório e diversidade
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {viewOptions.map((opt) => {
          const OptIcon = viewIcons[opt.value as InsightView]
          return (
            <button
              key={opt.value}
              onClick={() => setView(opt.value as InsightView)}
              className={cn(
                'rounded-xl border p-4 text-center transition-all cursor-pointer',
                view === opt.value
                  ? 'border-accent-light bg-accent-light/10'
                  : 'border-border bg-bg-card hover:bg-bg-card-hover'
              )}
            >
              <OptIcon
                size={20}
                className={cn(
                  'mx-auto mb-2',
                  view === opt.value
                    ? 'text-accent-light'
                    : 'text-text-muted'
                )}
              />
              <p className="text-xl font-bold">{opt.count}</p>
              <p className="text-[11px] text-text-muted mt-0.5">
                {opt.label}
              </p>
            </button>
          )
        })}
      </div>

      {/* Description */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-bg-card p-4">
        <Icon size={20} className="text-accent-light shrink-0" />
        <p className="text-sm text-text-secondary">
          {viewDescriptions[view]}
        </p>
      </div>

      {/* Song list */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-card">
              <th className="px-4 py-3 font-medium text-text-muted">Cântico</th>
              <th className="px-4 py-3 font-medium text-text-muted w-28">
                Última vez
              </th>
              <th className="px-4 py-3 font-medium text-text-muted w-24 text-center">
                Execuções
              </th>
              <th className="px-4 py-3 font-medium text-text-muted w-28">
                Dias
              </th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((song, idx) => (
              <tr
                key={song.id}
                className="border-b border-border/50 hover:bg-bg-card/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {view === 'most_played' && idx < 3 && (
                      <span
                        className={cn(
                          'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold',
                          idx === 0 && 'bg-yellow-500/20 text-yellow-500',
                          idx === 1 && 'bg-gray-400/20 text-gray-400',
                          idx === 2 && 'bg-amber-700/20 text-amber-700'
                        )}
                      >
                        {idx + 1}
                      </span>
                    )}
                    <span className="font-medium">
                      {formatSongTitle(song.number, song.name)}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-text-secondary text-xs">
                  {song.last_played
                    ? formatDate(song.last_played)
                    : '--'}
                </td>
                <td className="px-4 py-3 text-center text-text-secondary">
                  {song.executions}
                </td>
                <td className="px-4 py-3">
                  {song.days_since_last < 99999 ? (
                    <span
                      className={cn(
                        'text-xs font-medium',
                        getDiversityColor(song.days_since_last)
                      )}
                    >
                      {song.days_since_last} dias
                    </span>
                  ) : (
                    <span className="text-xs text-text-muted">--</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {currentData.length === 0 && (
          <div className="py-12 text-center text-text-muted">
            Nenhum cântico nesta categoria.
          </div>
        )}
      </div>
    </div>
  )
}
