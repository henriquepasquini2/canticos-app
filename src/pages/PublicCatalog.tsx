import { useState, useMemo } from 'react'
import { Search, FolderOpen, ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react'
import { useSongsWithStats } from '@/hooks/useSongs'
import { formatDate } from '@/lib/utils'
import { formatSongTitle, getDriveUrl } from '@/components/songs/SongName'

const DRIVE_ROOT_URL =
  'https://drive.google.com/drive/folders/1j2DvMakztJDxc-rwyRJFNGQ6QIEXdOAX'

type SortKey = 'number' | 'last_played' | 'executions'
type SortDir = 'asc' | 'desc'

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown size={14} className="opacity-40" />
  return dir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
}

export function PublicCatalog() {
  const { songs, loading } = useSongsWithStats()
  const [search, setSearch] = useState('')
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

  const filtered = useMemo(() => {
    let result = songs.filter((s) => s.is_playable && s.is_ready)

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) || String(s.number).includes(q)
      )
    }

    return [...result].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      switch (sortKey) {
        case 'number':
          return (a.number - b.number) * dir
        case 'last_played': {
          const aDate = a.last_played || '0000-00-00'
          const bDate = b.last_played || '0000-00-00'
          return aDate.localeCompare(bDate) * dir
        }
        case 'executions':
          return (a.executions - b.executions) * dir
        default:
          return 0
      }
    })
  }, [songs, search, sortKey, sortDir])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-text-muted">
          Carregando catálogo...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Catálogo</h1>
          <p className="text-text-secondary mt-1">
            {filtered.length} cânticos no repertório
          </p>
        </div>
        <a
          href={DRIVE_ROOT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg bg-bg-card border border-border px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-card-hover transition-colors shrink-0"
        >
          <FolderOpen size={16} />
          <span className="hidden sm:inline">Partituras no Drive</span>
        </a>
      </div>

      <div className="relative">
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

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-card">
              <th
                className="px-4 py-3 font-medium text-text-muted cursor-pointer hover:text-text-primary select-none"
                onClick={() => toggleSort('number')}
              >
                <span className="inline-flex items-center gap-1">
                  Cântico <SortIcon active={sortKey === 'number'} dir={sortDir} />
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
            </tr>
          </thead>
          <tbody>
            {filtered.map((song) => (
              <tr
                key={song.id}
                className="border-b border-border/50 hover:bg-bg-card/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <a
                    href={getDriveUrl(song.drive_folder_id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium hover:text-accent-light transition-colors inline-flex items-center gap-1"
                  >
                    {formatSongTitle(song.number, song.name)}
                    <ExternalLink size={12} className="opacity-40 shrink-0" />
                  </a>
                </td>
                <td className="px-4 py-3 text-text-secondary text-xs">
                  {song.last_played ? formatDate(song.last_played) : '--'}
                </td>
                <td className="px-4 py-3 text-center text-text-secondary">
                  {song.executions}
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
    </div>
  )
}
