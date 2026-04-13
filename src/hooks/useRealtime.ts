import { useEffect, useRef, useId } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

const DEBOUNCE_MS = 280

/** Refetch while tab is visible if postgres_changes does not fire (Supabase/RLS/network). */
export const LIVE_DATA_POLL_MS = 8_000

/**
 * Montar Domingo: lista “disponíveis” depende de `songs.is_playable` / `is_ready`.
 * Intervalo um pouco menor que o padrão para acompanhar edições no catálogo.
 */
export const SCHEDULE_BUILDER_POLL_MS = 5_000

type RealtimeOptions = {
  showToast?: boolean
  /**
   * When set, periodically refetch while the document is visible.
   * Use on pages where live updates matter (suggestions, domingo).
   */
  pollIntervalMs?: number
  /**
   * When true, keep polling even if the tab is in the background (e.g. admin edits
   * o catálogo noutra aba enquanto Montar Domingo fica aberto).
   * @default false
   */
  pollWhenHidden?: boolean
}

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
  usersAdmin: tablesKey(['approved_users', 'access_requests']),
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
  const pollIntervalMs = options?.pollIntervalMs
  const pollWhenHidden = options?.pollWhenHidden ?? false
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate
  const id = useId().replace(/:/g, '')

  const pendingToastRef = useRef(false)

  useEffect(() => {
    if (!pollIntervalMs || !enabled || !key) return
    const tick = () => {
      if (!pollWhenHidden && document.visibilityState !== 'visible') return
      onUpdateRef.current()
    }
    const interval = setInterval(tick, pollIntervalMs)
    return () => clearInterval(interval)
  }, [enabled, key, pollIntervalMs, pollWhenHidden])

  useEffect(() => {
    if (!pollIntervalMs || !enabled || !key) return
    const onVisible = () => {
      if (document.visibilityState === 'visible') onUpdateRef.current()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [enabled, key, pollIntervalMs])

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
    // One channel per table: multi-table channels compare server vs client bindings by
    // array index; if order differs, subscribe fails silently and no events arrive.
    const channels = tableList.map((table) => {
      const ch = supabase.channel(`rt-${safeKey}-${table}-${id}`)
      ch.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        schedule
      )
      ch.subscribe((status, err) => {
        if (status !== 'SUBSCRIBED' && status !== 'CLOSED') {
          console.warn(`[canticos realtime] ${table}:`, status, err)
        }
      })
      return ch
    })

    return () => {
      clearTimeout(timeout)
      for (const ch of channels) {
        void supabase.removeChannel(ch)
      }
    }
  }, [enabled, id, key, showToast])
}
