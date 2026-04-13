import { useEffect, useRef, useId } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

const DEBOUNCE_MS = 280

type RealtimeOptions = { showToast?: boolean }

function tablesKey(tables: readonly string[]) {
  return tables.join('\0')
}

/** Preset table groups for realtime (stable keys for useMultiRealtime). */
export const REALTIME = {
  scheduleBuilder: tablesKey([
    'sunday_songs',
    'comments',
    'songs',
    'sundays',
  ]),
  songsAndLinks: tablesKey(['songs', 'sunday_songs']),
  sundaysAndLinks: tablesKey(['sundays', 'sunday_songs']),
  home: tablesKey(['sundays', 'sunday_songs', 'songs']),
  dashboard: tablesKey(['songs', 'sunday_songs', 'sundays', 'suggestions']),
  suggestions: tablesKey(['suggestions']),
  usersAdmin: tablesKey(['approved_users', 'access_requests', 'admins']),
} as const

/**
 * Subscribe to postgres_changes on one table (debounced refetch).
 */
export function useRealtime(
  table: string,
  onUpdate: () => void,
  enabled = true,
  options?: RealtimeOptions
) {
  useMultiRealtime(tablesKey([table]), onUpdate, enabled, options)
}

/**
 * Subscribe to several tables. `tablesKey` must be a stable string from {@link REALTIME}
 * or `tablesKey(['a','b'])` defined at module scope.
 */
export function useMultiRealtime(
  key: string,
  onUpdate: () => void,
  enabled = true,
  options?: RealtimeOptions
) {
  const showToast = options?.showToast ?? false
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate
  const id = useId().replace(/:/g, '')

  const pendingToastRef = useRef(false)

  useEffect(() => {
    if (!enabled || !key) return

    const tableList = key.split('\0').filter(Boolean)
    if (tableList.length === 0) return

    let timeout: ReturnType<typeof setTimeout> | undefined
    const flush = () => {
      onUpdateRef.current()
      if (showToast && pendingToastRef.current) {
        toast.info('Dados atualizados')
        pendingToastRef.current = false
      }
    }

    const schedule = () => {
      if (showToast) pendingToastRef.current = true
      clearTimeout(timeout)
      timeout = setTimeout(flush, DEBOUNCE_MS)
    }

    const safeKey = key.replace(/\0/g, '-')
    const channel = supabase.channel(`rt-${safeKey}-${id}`)
    for (const table of tableList) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        schedule
      )
    }
    channel.subscribe()

    return () => {
      clearTimeout(timeout)
      supabase.removeChannel(channel)
    }
  }, [enabled, id, key, showToast])
}
