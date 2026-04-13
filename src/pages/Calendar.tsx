import { useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSunday,
  addMonths,
  subMonths,
  getDay,
  isToday,
  isFuture,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import { useSundays } from '@/hooks/useSundays'
import { useMultiRealtime, REALTIME, LIVE_DATA_POLL_MS } from '@/hooks/useRealtime'
import { Badge } from '@/components/ui/Badge'
import { formatSongTitle, DriveLink } from '@/components/songs/SongName'
import { cn } from '@/lib/utils'

export function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const { sundays, refetch: refetchSundays } = useSundays()

  const refreshCalendar = useCallback(() => {
    void refetchSundays()
  }, [refetchSundays])

  useMultiRealtime(REALTIME.sundaysAndLinks, refreshCalendar, true, {
    pollIntervalMs: LIVE_DATA_POLL_MS,
  })

  const sundayMap = useMemo(() => {
    const map = new Map<string, typeof sundays[0]>()
    sundays.forEach((s) => map.set(s.date, s))
    return map
  }, [sundays])

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const sundaysInMonth = daysInMonth.filter((d) => isSunday(d))
  const startPadding = getDay(monthStart)

  const monthLabel = format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Calendário</h1>
          <p className="text-text-secondary mt-1">
            Cronograma de domingos
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="rounded-lg p-2 hover:bg-bg-card transition-colors cursor-pointer"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-lg font-semibold capitalize">{monthLabel}</h2>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="rounded-lg p-2 hover:bg-bg-card transition-colors cursor-pointer"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Month grid - hidden on mobile */}
      <div className="hidden sm:block">
        <div className="grid grid-cols-7 gap-px rounded-t-xl overflow-hidden">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
            <div
              key={day}
              className="bg-bg-card py-2 text-center text-xs font-medium text-text-muted"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px rounded-b-xl overflow-hidden border border-border">
          {Array.from({ length: startPadding }).map((_, i) => (
            <div key={`pad-${i}`} className="bg-bg-secondary/30 min-h-24" />
          ))}
          {daysInMonth.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const sundayData = isSunday(day) ? sundayMap.get(dateStr) : undefined
            const dayNum = format(day, 'd')
            const today = isToday(day)
            const songCount = sundayData?.sunday_songs.length ?? 0
            const hasSongs = songCount > 0

            const CellTag = isSunday(day) ? Link : 'div'
            const cellProps = isSunday(day)
              ? { to: `/admin/domingo/${dateStr}`, key: dateStr }
              : { key: dateStr }

            return (
              <CellTag
                {...cellProps as any}
                className={cn(
                  'min-h-24 p-2 transition-colors block',
                  hasSongs && 'min-h-36 sm:min-h-44',
                  isSunday(day)
                    ? 'bg-bg-card hover:bg-bg-card-hover cursor-pointer'
                    : 'bg-bg-secondary/30',
                  today && 'ring-1 ring-accent-light'
                )}
              >
                <span
                  className={cn(
                    'text-xs font-medium',
                    isSunday(day) ? 'text-text-primary' : 'text-text-muted',
                    today && 'text-accent-light'
                  )}
                >
                  {dayNum}
                </span>
                {sundayData && (
                  <div className="mt-1.5 space-y-1">
                    {sundayData.sunday_songs.slice(0, 4).map((ss) => (
                      <div
                        key={ss.id}
                        className="break-words text-[11px] leading-snug text-text-secondary sm:text-xs line-clamp-2"
                      >
                        {formatSongTitle(ss.song.number, ss.song.name)}
                      </div>
                    ))}
                    {sundayData.sunday_songs.length > 4 && (
                      <span className="text-[11px] text-text-muted sm:text-xs">
                        +{sundayData.sunday_songs.length - 4} mais
                      </span>
                    )}
                  </div>
                )}
              </CellTag>
            )
          })}
        </div>
      </div>

      {/* Sunday list for the month */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          Domingos de{' '}
          <span className="capitalize">
            {format(currentMonth, 'MMMM', { locale: ptBR })}
          </span>
        </h2>
        <div className="space-y-3">
          {sundaysInMonth.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const sundayData = sundayMap.get(dateStr)
            const future = isFuture(day)

            const hasSongs =
              sundayData && sundayData.sunday_songs.length > 0

            return (
              <Link
                key={dateStr}
                to={`/admin/domingo/${dateStr}`}
                className="flex flex-col gap-3 rounded-xl border border-border bg-bg-card p-4 transition-colors hover:bg-bg-card-hover sm:flex-row sm:items-start sm:gap-4"
              >
                <div className="flex shrink-0 items-baseline gap-2 sm:block sm:w-14 sm:text-center">
                  <p className="text-2xl font-bold leading-none">
                    {format(day, 'dd')}
                  </p>
                  <p className="text-xs font-medium uppercase tracking-wide text-text-muted sm:text-[10px]">
                    {format(day, 'MMM', { locale: ptBR })}
                  </p>
                </div>
                <div className="min-w-0 flex-1">
                  {hasSongs ? (
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-1.5">
                      {sundayData!.sunday_songs.map((ss) => (
                        <DriveLink
                          key={ss.id}
                          driveFolderId={ss.song.drive_folder_id}
                          className="block w-full sm:w-auto"
                        >
                          <Badge
                            variant="info"
                            className="hover:bg-accent-light/25 flex w-full cursor-pointer items-start gap-1.5 whitespace-normal rounded-lg px-3 py-2 text-left text-sm leading-snug sm:inline-flex sm:w-auto sm:items-center sm:rounded-full sm:px-2.5 sm:py-0.5 sm:text-xs"
                          >
                            <span className="min-w-0 flex-1 break-words">
                              {formatSongTitle(ss.song.number, ss.song.name)}
                            </span>
                            <ExternalLink
                              className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-50 sm:mt-0 sm:h-2.5 sm:w-2.5"
                              aria-hidden
                            />
                          </Badge>
                        </DriveLink>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-text-muted">
                      {future ? 'A planejar' : 'Sem registro'}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
