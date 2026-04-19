import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import type { DateRange } from '@/contexts/FiltersContext'
import type {
  Platform,
  KPISummaryResult,
  DailyTrendRow,
  PlatformBreakdownRow,
  FunnelMetrics,
  FunnelByPlatformRow,
} from '@/types/database'

function baseParams(dateRange: DateRange, clientId: string | null, platforms: Platform[]) {
  return {
    p_date_from: format(dateRange.from, 'yyyy-MM-dd'),
    p_date_to: format(dateRange.to, 'yyyy-MM-dd'),
    p_client_id: clientId,
    p_platforms: platforms.length > 0 ? platforms : null,
  }
}

function qk(key: string, dateRange: DateRange, clientId: string | null, platforms?: Platform[]) {
  return [key, format(dateRange.from, 'yyyy-MM-dd'), format(dateRange.to, 'yyyy-MM-dd'), clientId, platforms ?? []]
}

export function useKPISummary(dateRange: DateRange, clientId: string | null, platforms: Platform[]) {
  return useQuery({
    queryKey: qk('kpi-summary', dateRange, clientId, platforms),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_kpi_summary', baseParams(dateRange, clientId, platforms))
      if (error) throw error
      return data as unknown as KPISummaryResult
    },
  })
}

export function useDailyTrend(dateRange: DateRange, clientId: string | null, platforms: Platform[]) {
  return useQuery({
    queryKey: qk('daily-trend', dateRange, clientId, platforms),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_daily_trend', baseParams(dateRange, clientId, platforms))
      if (error) throw error
      return (data ?? []) as unknown as DailyTrendRow[]
    },
  })
}

export function usePlatformBreakdown(dateRange: DateRange, clientId: string | null) {
  return useQuery({
    queryKey: qk('platform-breakdown', dateRange, clientId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_platform_breakdown', {
        p_date_from: format(dateRange.from, 'yyyy-MM-dd'),
        p_date_to: format(dateRange.to, 'yyyy-MM-dd'),
        p_client_id: clientId,
      })
      if (error) throw error
      return (data ?? []) as unknown as PlatformBreakdownRow[]
    },
  })
}

export function useFunnelMetrics(dateRange: DateRange, clientId: string | null, platforms: Platform[]) {
  return useQuery({
    queryKey: qk('funnel-metrics', dateRange, clientId, platforms),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_funnel_metrics', baseParams(dateRange, clientId, platforms))
      if (error) throw error
      return data as unknown as FunnelMetrics
    },
  })
}

export function useFunnelByPlatform(dateRange: DateRange, clientId: string | null, platforms: Platform[]) {
  return useQuery({
    queryKey: qk('funnel-by-platform', dateRange, clientId, platforms),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_funnel_by_platform', baseParams(dateRange, clientId, platforms))
      if (error) throw error
      return (data ?? []) as unknown as FunnelByPlatformRow[]
    },
  })
}
