import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Suggestion } from '@/lib/types'

export function useSuggestions() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSuggestions = useCallback(async () => {
    const { data, error } = await supabase
      .from('suggestions')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) setSuggestions(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchSuggestions() }, [fetchSuggestions])

  const addSuggestion = async (
    suggestion: {
      song_name: string
      artist?: string
      suggested_by: string
      reason?: string
      link?: string
    },
    userId: string
  ) => {
    const { error } = await supabase
      .from('suggestions')
      .insert({ ...suggestion, user_id: userId })
    if (!error) await fetchSuggestions()
    return { error }
  }

  const deleteOwnPending = async (id: number) => {
    const { error } = await supabase.from('suggestions').delete().eq('id', id)
    if (!error) await fetchSuggestions()
    return { error }
  }

  const updateStatus = async (
    id: number,
    status: 'pendente' | 'aprovada' | 'rejeitada'
  ) => {
    const { error } = await supabase
      .from('suggestions')
      .update({ status })
      .eq('id', id)
    if (!error) await fetchSuggestions()
    return { error }
  }

  const pendingCount = suggestions.filter((s) => s.status === 'pendente').length

  return {
    suggestions,
    loading,
    refetch: fetchSuggestions,
    addSuggestion,
    deleteOwnPending,
    updateStatus,
    pendingCount,
  }
}
