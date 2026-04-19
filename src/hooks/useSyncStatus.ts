import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { SyncLog } from '@/types/database'

export function useSyncLog() {
  return useQuery({
    queryKey: ['sync-log'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sync_log')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(20)
      if (error) throw error
      return (data ?? []) as SyncLog[]
    },
    refetchInterval: 30_000,
  })
}

export function useTriggerSync() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke('trigger-sync')
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sync-log'] })
      qc.invalidateQueries({ queryKey: ['kpi-summary'] })
      qc.invalidateQueries({ queryKey: ['daily-trend'] })
      qc.invalidateQueries({ queryKey: ['platform-breakdown'] })
      qc.invalidateQueries({ queryKey: ['top-campaigns'] })
      qc.invalidateQueries({ queryKey: ['funnel-metrics'] })
    },
  })
}
