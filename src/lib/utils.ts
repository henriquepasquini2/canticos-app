import { differenceInDays, format, parseISO, nextSunday, isSunday, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Song, SongWithStats, SundaySong } from './types'
import { FORGOTTEN_DAYS, MEDIUM_DAYS, RECENT_DAYS } from './constants'

export function formatDate(date: string | Date, pattern = "dd/MM/yyyy"): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, pattern, { locale: ptBR })
}

export function formatDateLong(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
}

export function getNextSunday(): Date {
  const today = startOfDay(new Date())
  return isSunday(today) ? today : nextSunday(today)
}

export function daysSince(dateStr: string): number {
  return differenceInDays(new Date(), parseISO(dateStr))
}

export function computeSongStats(
  song: Song,
  sundaySongs: (SundaySong & { sunday?: { date: string } })[]
): SongWithStats {
  const entries = sundaySongs.filter((ss) => ss.song_id === song.id)
  const dates = entries
    .map((e) => e.sunday?.date)
    .filter((d): d is string => !!d)
    .sort()

  const lastPlayed = dates.length > 0 ? dates[dates.length - 1] : null
  const daysSinceLast = lastPlayed ? daysSince(lastPlayed) : 99999

  return {
    ...song,
    executions: dates.length,
    days_since_last: daysSinceLast,
    last_played: lastPlayed,
    dates_played: dates,
  }
}

export function getDiversityColor(daysSinceLast: number): string {
  if (daysSinceLast > MEDIUM_DAYS) return 'text-success'
  if (daysSinceLast > RECENT_DAYS) return 'text-warning'
  return 'text-danger'
}

export function getDiversityBg(daysSinceLast: number): string {
  if (daysSinceLast > MEDIUM_DAYS) return 'bg-success/15 border-success/30'
  if (daysSinceLast > RECENT_DAYS) return 'bg-warning/15 border-warning/30'
  return 'bg-danger/15 border-danger/30'
}

export function getDiversityLabel(daysSinceLast: number): string {
  if (daysSinceLast >= 99999) return 'Nunca tocada'
  if (daysSinceLast > FORGOTTEN_DAYS) return `${daysSinceLast} dias (esquecida)`
  if (daysSinceLast > MEDIUM_DAYS) return `${daysSinceLast} dias`
  if (daysSinceLast > RECENT_DAYS) return `${daysSinceLast} dias (recente)`
  return `${daysSinceLast} dias (muito recente)`
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}
