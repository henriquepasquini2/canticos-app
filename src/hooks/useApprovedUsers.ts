import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { ApprovedUser } from '@/lib/types'

export function useApprovedUsers() {
  const [users, setUsers] = useState<ApprovedUser[]>([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = useCallback(async () => {
    const { data, error } = await supabase
      .from('approved_users')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) setUsers(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const addUser = async (email: string, name?: string) => {
    const { error } = await supabase
      .from('approved_users')
      .insert({ email: email.toLowerCase().trim(), name: name?.trim() || null })

    if (!error) await fetchUsers()
    return { error }
  }

  const removeUser = async (id: number) => {
    const { error } = await supabase
      .from('approved_users')
      .delete()
      .eq('id', id)

    if (!error) await fetchUsers()
    return { error }
  }

  return { users, loading, refetch: fetchUsers, addUser, removeUser }
}
