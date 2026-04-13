import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export function useRealtime(
  table: string,
  onUpdate: () => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return

    const channel = supabase
      .channel(`realtime-${table}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => {
          const eventLabels: Record<string, string> = {
            INSERT: 'adicionado',
            UPDATE: 'atualizado',
            DELETE: 'removido',
          }
          const label = eventLabels[payload.eventType] || 'alterado'
          toast.info(`Dado ${label} em ${table}`)
          onUpdate()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, onUpdate, enabled])
}
