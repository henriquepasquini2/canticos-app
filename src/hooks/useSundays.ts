import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { SundayWithSongs, SundaySong } from '@/lib/types'

export function useSundays(limit?: number) {
  const [sundays, setSundays] = useState<SundayWithSongs[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSundays = useCallback(async () => {
    let query = supabase
      .from('sundays')
      .select('*, sunday_songs(*, song:songs(*))')
      .order('date', { ascending: false })

    if (limit) query = query.limit(limit)

    const { data, error } = await query

    if (!error && data) {
      const mapped = data.map((s) => ({
        ...s,
        sunday_songs: (s.sunday_songs || [])
          .sort((a: SundaySong, b: SundaySong) => a.position - b.position),
      }))
      setSundays(mapped as SundayWithSongs[])
    }
    setLoading(false)
  }, [limit])

  useEffect(() => { fetchSundays() }, [fetchSundays])

  return { sundays, loading, refetch: fetchSundays }
}

export function useSunday(date: string | undefined) {
  const [sunday, setSunday] = useState<SundayWithSongs | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSunday = useCallback(async () => {
    if (!date) { setLoading(false); return }

    const { data } = await supabase
      .from('sundays')
      .select('*, sunday_songs(*, song:songs(*))')
      .eq('date', date)
      .single()

    if (data) {
      const mapped = {
        ...data,
        sunday_songs: (data.sunday_songs || [])
          .sort((a: SundaySong, b: SundaySong) => a.position - b.position),
      }
      setSunday(mapped as SundayWithSongs)
    }
    setLoading(false)
  }, [date])

  useEffect(() => { fetchSunday() }, [fetchSunday])

  const addSong = async (songId: number, position: number) => {
    if (!sunday) {
      const { data: newSunday } = await supabase
        .from('sundays')
        .upsert({ date }, { onConflict: 'date' })
        .select()
        .single()

      if (!newSunday) return

      await supabase
        .from('sunday_songs')
        .insert({ sunday_id: newSunday.id, song_id: songId, position })

      await fetchSunday()
      return
    }

    await supabase
      .from('sunday_songs')
      .insert({ sunday_id: sunday.id, song_id: songId, position })

    await fetchSunday()
  }

  const removeSong = async (sundaySongId: number) => {
    await supabase.from('sunday_songs').delete().eq('id', sundaySongId)
    await fetchSunday()
  }

  const reorderSongs = async (
    items: { id: number; position: number }[]
  ) => {
    const updates = items.map((item) =>
      supabase
        .from('sunday_songs')
        .update({ position: item.position })
        .eq('id', item.id)
    )
    await Promise.all(updates)
    await fetchSunday()
  }

  const updateNotes = async (notes: string) => {
    if (!sunday) return
    await supabase.from('sundays').update({ notes }).eq('id', sunday.id)
    await fetchSunday()
  }

  return {
    sunday,
    loading,
    refetch: fetchSunday,
    addSong,
    removeSong,
    reorderSongs,
    updateNotes,
  }
}

export function useUpcomingSundays(count = 4) {
  const [sundays, setSundays] = useState<SundayWithSongs[]>([])
  const [loading, setLoading] = useState(true)

  const fetchUpcoming = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0]

    const { data } = await supabase
      .from('sundays')
      .select('*, sunday_songs(*, song:songs(*))')
      .gte('date', today)
      .order('date', { ascending: true })
      .limit(count)

    if (data) {
      const mapped = data.map((s) => ({
        ...s,
        sunday_songs: (s.sunday_songs || [])
          .sort((a: SundaySong, b: SundaySong) => a.position - b.position),
      }))
      setSundays(mapped as SundayWithSongs[])
    }
    setLoading(false)
  }, [count])

  useEffect(() => { fetchUpcoming() }, [fetchUpcoming])

  return { sundays, loading, refetch: fetchUpcoming }
}

export function useRecentSundays(count = 4) {
  const [sundays, setSundays] = useState<SundayWithSongs[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRecent = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0]

    const { data } = await supabase
      .from('sundays')
      .select('*, sunday_songs(*, song:songs(*))')
      .lt('date', today)
      .order('date', { ascending: false })
      .limit(count)

    if (data) {
      const mapped = data.map((s) => ({
        ...s,
        sunday_songs: (s.sunday_songs || [])
          .sort((a: SundaySong, b: SundaySong) => a.position - b.position),
      }))
      setSundays(mapped as SundayWithSongs[])
    }
    setLoading(false)
  }, [count])

  useEffect(() => { fetchRecent() }, [fetchRecent])

  return { sundays, loading, refetch: fetchRecent }
}
