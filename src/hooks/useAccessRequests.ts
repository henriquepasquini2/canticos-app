import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { AccessRequest } from '@/lib/types'

/** Hook for the requesting user: check own status + submit request */
export function useMyAccessRequest(email: string | undefined) {
  const [request, setRequest] = useState<AccessRequest | null>(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!email) { setLoading(false); return }

    const { data, error } = await supabase
      .from('access_requests')
      .select('*')
      .eq('email', email)
      .single()

    // Gracefully handle missing table (schema not yet applied)
    if (error && error.code === 'PGRST205') {
      setLoading(false)
      return
    }

    setRequest(data ?? null)
    setLoading(false)
  }, [email])

  useEffect(() => { fetch() }, [fetch])

  const submitRequest = async (message?: string) => {
    if (!email) return { error: new Error('No email') }

    const { error } = await supabase
      .from('access_requests')
      .insert({ email, message: message?.trim() || null })

    if (!error) await fetch()
    return { error }
  }

  return { request, loading, refetch: fetch, submitRequest }
}

/** Hook for admins: list all pending requests + approve/deny */
export function useAccessRequests() {
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRequests = useCallback(async () => {
    const { data, error } = await supabase
      .from('access_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) setRequests(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  const approveRequest = async (req: AccessRequest) => {
    // 1. Add to approved_users
    const { error: addErr } = await supabase
      .from('approved_users')
      .insert({ email: req.email, name: req.message })
      .select()

    if (addErr && !addErr.message.includes('duplicate')) {
      return { error: addErr }
    }

    // 2. Mark request as approved
    const { error: updateErr } = await supabase
      .from('access_requests')
      .update({ status: 'approved' })
      .eq('id', req.id)

    if (!updateErr) await fetchRequests()
    return { error: updateErr }
  }

  const denyRequest = async (id: number) => {
    const { error } = await supabase
      .from('access_requests')
      .update({ status: 'denied' })
      .eq('id', id)

    if (!error) await fetchRequests()
    return { error }
  }

  const deleteRequest = async (id: number) => {
    const { error } = await supabase
      .from('access_requests')
      .delete()
      .eq('id', id)

    if (!error) await fetchRequests()
    return { error }
  }

  const pendingCount = requests.filter((r) => r.status === 'pending').length

  return { requests, loading, refetch: fetchRequests, approveRequest, denyRequest, deleteRequest, pendingCount }
}
