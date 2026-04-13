import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Song, SongWithStats } from '@/lib/types'
import { FORGOTTEN_DAYS } from '@/lib/constants'

export function useSongs() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSongs = useCallback(async () => {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .order('number', { ascending: true })

    if (!error && data) setSongs(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchSongs() }, [fetchSongs])

  return { songs, loading, refetch: fetchSongs }
}

export function useSongsWithStats() {
  const [songs, setSongs] = useState<SongWithStats[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSongsWithStats = useCallback(async () => {
    const { data: allSongs } = await supabase
      .from('songs')
      .select('*')
      .order('number', { ascending: true })

    const { data: sundaySongs } = await supabase
      .from('sunday_songs')
      .select('*, sunday:sundays(date)')

    if (!allSongs) { setLoading(false); return }

    const now = new Date()
    const mapped: SongWithStats[] = allSongs.map((song: Song) => {
      const entries = (sundaySongs || []).filter(
        (ss: { song_id: number }) => ss.song_id === song.id
      )
      const dates = entries
        .map((e: { sunday: { date: string } | null }) => e.sunday?.date)
        .filter((d: string | undefined): d is string => !!d)
        .sort()

      const lastPlayed = dates.length > 0 ? dates[dates.length - 1] : null
      const daysSinceLast = lastPlayed
        ? Math.floor(
            (now.getTime() - new Date(lastPlayed + 'T00:00:00').getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 99999

      return {
        ...song,
        executions: dates.length,
        days_since_last: daysSinceLast,
        last_played: lastPlayed,
        dates_played: dates,
      }
    })

    setSongs(mapped)
    setLoading(false)
  }, [])

  useEffect(() => { fetchSongsWithStats() }, [fetchSongsWithStats])

  return { songs, loading, refetch: fetchSongsWithStats }
}

export function useSongStats() {
  const { songs, loading } = useSongsWithStats()

  const playable = songs.filter((s) => s.is_playable && s.is_ready)
  const neverPlayed = playable.filter((s) => s.executions === 0)
  const forgotten = playable.filter(
    (s) => s.days_since_last > FORGOTTEN_DAYS && s.days_since_last < 99999
  )
  const recentlyPlayed = playable.filter((s) => s.days_since_last <= 30)

  return {
    songs,
    loading,
    total: songs.length,
    playableCount: playable.length,
    neverPlayedCount: neverPlayed.length,
    forgottenCount: forgotten.length,
    recentCount: recentlyPlayed.length,
  }
}
