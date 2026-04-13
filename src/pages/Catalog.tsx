import { useState, useMemo } from 'react'
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { useSongsWithStats } from '@/hooks/useSongs'
import { FilterBar } from '@/components/ui/FilterBar'
import { Badge } from '@/components/ui/Badge'
import { SongDetail } from '@/components/songs/SongDetail'
import { formatDate, getDiversityColor, cn } from '@/lib/utils'
import { formatSongTitle } from '@/components/songs/SongName'
import { FORGOTTEN_DAYS } from '@/lib/constants'
import type { SongFilter, SongWithStats } from '@/lib/types'

type SortKey = 'number' | 'name' | 'last_played' | 'executions' | 'days_since_last' | 'status'
type SortDir = 'asc' | 'desc'

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown size={14} className="opacity-40" />
  return dir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
}

export function Catalog() {
  const { songs, loading, refetch } = useSongsWithStats()
  const [filter, setFilter] = useState<SongFilter>('all')
  const [search, setSearch] = useState('')
  const [selectedSong, setSelectedSong] = useState<SongWithStats | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('number')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const counts = useMemo(() => {
    const playable = songs.filter((s) => s.is_playable && s.is_ready)
    return {
      all: songs.length,
      playable: playable.length,
      not_playable: songs.filter((s) => !s.is_playable).length,
      not_ready: songs.filter((s) => !s.is_ready).length,
      never_played: playable.filter((s) => s.executions === 0).length,
      forgotten: playable.filter(
        (s) => s.days_since_last > FORGOTTEN_DAYS && s.days_since_last < 99999
      ).length,
    }
  }, [songs])

  const filtered = useMemo(() => {
    let result = songs

    switch (filter) {
      case 'playable':
        result = result.filter((s) => s.is_playable && s.is_ready)
        break
      case 'not_playable':
        result = result.filter((s) => !s.is_playable)
        break
      case 'not_ready':
        result = result.filter((s) => !s.is_ready)
        break
      case 'never_played':
        result = result.filter(
          (s) => s.is_playable && s.is_ready && s.executions === 0
        )
        break
      case 'forgotten':
        result = result.filter(
          (s) =>
            s.is_playable &&
            s.is_ready &&
            s.days_since_last > FORGOTTEN_DAYS &&
            s.days_since_last < 99999
        )
        break
    }

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          String(s.number).includes(q)
      )
    }

    const sorted = [...result].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      switch (sortKey) {
        case 'number':
          return (a.number - b.number) * dir
        case 'name':
          return a.name.localeCompare(b.name) * dir
        case 'last_played': {
          const aDate = a.last_played || '0000-00-00'
          const bDate = b.last_played || '0000-00-00'
          return aDate.localeCompare(bDate) * dir
        }
        case 'executions':
          return (a.executions - b.executions) * dir
        case 'days_since_last':
          return (a.days_since_last - b.days_since_last) * dir
        case 'status': {
          const aScore = a.is_playable && a.is_ready ? 0 : a.is_ready ? 1 : 2
          const bScore = b.is_playable && b.is_ready ? 0 : b.is_ready ? 1 : 2
          return (aScore - bScore) * dir
        }
        default:
          return 0
      }
    })

    return sorted
  }, [songs, filter, search, sortKey, sortDir])

  const filterOptions = [
    { value: 'all', label: 'Todas', count: counts.all },
    { value: 'playable', label: 'Tocáveis', count: counts.playable },
    { value: 'not_playable', label: 'Não tocar', count: counts.not_playable },
    { value: 'not_ready', label: 'A preparar', count: counts.not_ready },
    { value: 'never_played', label: 'Nunca tocadas', count: counts.never_played },
    { value: 'forgotten', label: 'Esquecidas', count: counts.forgotten },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-text-muted">Carregando catálogo...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Catálogo</h1>
        <p className="text-text-secondary mt-1">
          {songs.length} cânticos no repertório
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Buscar por nome ou número..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-bg-input pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent-light"
          />
        </div>
      </div>

      <FilterBar
        options={filterOptions}
        value={filter}
        onChange={(v) => setFilter(v as SongFilter)}
      />

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-card">
              <th
                className="px-4 py-3 font-medium text-text-muted cursor-pointer hover:text-text-primary select-none"
                onClick={() => toggleSort('number')}
              >
                <span className="inline-flex items-center gap-1">
                  Cântico <SortIcon active={sortKey === 'number' || sortKey === 'name'} dir={sortDir} />
                </span>
              </th>
              <th
                className="px-4 py-3 font-medium text-text-muted w-28 cursor-pointer hover:text-text-primary select-none"
                onClick={() => toggleSort('last_played')}
              >
                <span className="inline-flex items-center gap-1">
                  Última vez <SortIcon active={sortKey === 'last_played'} dir={sortDir} />
                </span>
              </th>
              <th
                className="px-4 py-3 font-medium text-text-muted w-20 text-center cursor-pointer hover:text-text-primary select-none"
                onClick={() => toggleSort('executions')}
              >
                <span className="inline-flex items-center gap-1">
                  Exec. <SortIcon active={sortKey === 'executions'} dir={sortDir} />
                </span>
              </th>
              <th
                className="px-4 py-3 font-medium text-text-muted w-24 cursor-pointer hover:text-text-primary select-none"
                onClick={() => toggleSort('days_since_last')}
              >
                <span className="inline-flex items-center gap-1">
                  Dias <SortIcon active={sortKey === 'days_since_last'} dir={sortDir} />
                </span>
              </th>
              <th
                className="px-4 py-3 font-medium text-text-muted w-32 cursor-pointer hover:text-text-primary select-none"
                onClick={() => toggleSort('status')}
              >
                <span className="inline-flex items-center gap-1">
                  Status <SortIcon active={sortKey === 'status'} dir={sortDir} />
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((song) => (
              <tr
                key={song.id}
                onClick={() => setSelectedSong(song)}
                className="border-b border-border/50 hover:bg-bg-card/50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3">
                  <span className="font-medium">
                    {formatSongTitle(song.number, song.name)}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-secondary text-xs">
                  {song.last_played
                    ? formatDate(song.last_played)
                    : '--'}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-text-secondary">{song.executions}</span>
                </td>
                <td className="px-4 py-3">
                  {song.days_since_last < 99999 ? (
                    <span
                      className={cn(
                        'text-xs font-medium',
                        getDiversityColor(song.days_since_last)
                      )}
                    >
                      {song.days_since_last}d
                    </span>
                  ) : (
                    <span className="text-xs text-text-muted">--</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {!song.is_playable && (
                      <Badge variant="danger">Não tocar</Badge>
                    )}
                    {!song.is_ready && (
                      <Badge variant="warning">A fazer</Badge>
                    )}
                    {song.is_playable && song.is_ready && (
                      <Badge variant="success">OK</Badge>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-text-muted">
            Nenhum cântico encontrado.
          </div>
        )}
      </div>

      <SongDetail
        song={selectedSong}
        open={!!selectedSong}
        onClose={() => setSelectedSong(null)}
        onUpdate={() => {
          refetch()
          setSelectedSong(null)
        }}
      />
    </div>
  )
}
