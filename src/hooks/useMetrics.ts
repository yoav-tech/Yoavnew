import { useQuery } from '@tanstack/react-query'
import { format, subDays, differenceInDays } from 'date-fns'
import { fetchWindsor, sumMetrics } from '@/lib/windsor'
import type { DateRange } from '@/contexts/FiltersContext'
import type { Platform } from '@/types/database'

function fmt(d: Date) { return format(d, 'yyyy-MM-dd') }

function filterByPlatform(rows: Awaited<ReturnType<typeof fetchWindsor>>, platforms: Platform[]) {
  if (platforms.length === 0) return rows
  return rows.filter((r) => platforms.includes(r.datasource as Platform))
}

function useWindsorRaw(from: string, to: string) {
  return useQuery({
    queryKey: ['windsor', from, to],
    queryFn: () => fetchWindsor(from, to),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}

export function useKPISummary(dateRange: DateRange, _clientId: string | null, platforms: Platform[]) {
  const from = fmt(dateRange.from)
  const to = fmt(dateRange.to)
  const days = differenceInDays(dateRange.to, dateRange.from) + 1
  const priorTo = fmt(subDays(dateRange.from, 1))
  const priorFrom = fmt(subDays(dateRange.from, days))

  const curr = useWindsorRaw(from, to)
  const prior = useWindsorRaw(priorFrom, priorTo)

  const isLoading = curr.isLoading || prior.isLoading
  const error = curr.error || prior.error

  const data = (!isLoading && curr.data && prior.data) ? {
    current: sumMetrics(filterByPlatform(curr.data, platforms)),
    prior: sumMetrics(filterByPlatform(prior.data, platforms)),
  } : undefined

  return { data, isLoading, error }
}

export function useDailyTrend(dateRange: DateRange, _clientId: string | null, platforms: Platform[]) {
  const from = fmt(dateRange.from)
  const to = fmt(dateRange.to)
  const { data: rows = [], isLoading, error } = useWindsorRaw(from, to)

  const filtered = filterByPlatform(rows, platforms)

  const byDate = filtered.reduce<Record<string, { date: string; spend: number; revenue: number; clicks: number; conversions: number }>>((acc, r) => {
    if (!acc[r.date]) acc[r.date] = { date: r.date, spend: 0, revenue: 0, clicks: 0, conversions: 0 }
    acc[r.date].spend += r.spend
    acc[r.date].revenue += r.revenue
    acc[r.date].clicks += r.clicks
    acc[r.date].conversions += r.conversions
    return acc
  }, {})

  const data = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date))

  return { data, isLoading, error }
}

export function usePlatformBreakdown(dateRange: DateRange, _clientId: string | null) {
  const from = fmt(dateRange.from)
  const to = fmt(dateRange.to)
  const { data: rows = [], isLoading, error } = useWindsorRaw(from, to)

  const byPlatform = rows.reduce<Record<string, { platform: string; spend: number; revenue: number; clicks: number; conversions: number; impressions: number }>>((acc, r) => {
    if (!acc[r.datasource]) acc[r.datasource] = { platform: r.datasource, spend: 0, revenue: 0, clicks: 0, conversions: 0, impressions: 0 }
    acc[r.datasource].spend += r.spend
    acc[r.datasource].revenue += r.revenue
    acc[r.datasource].clicks += r.clicks
    acc[r.datasource].conversions += r.conversions
    acc[r.datasource].impressions += r.impressions
    return acc
  }, {})

  const data = Object.values(byPlatform).sort((a, b) => b.spend - a.spend)

  return { data, isLoading, error }
}

export function useFunnelMetrics(dateRange: DateRange, _clientId: string | null, platforms: Platform[]) {
  const from = fmt(dateRange.from)
  const to = fmt(dateRange.to)
  const { data: rows = [], isLoading, error } = useWindsorRaw(from, to)

  const filtered = filterByPlatform(rows, platforms)
  const totals = sumMetrics(filtered)

  const data = {
    impressions: totals.impressions,
    clicks: totals.clicks,
    conversions: totals.conversions,
    spend: totals.spend,
    revenue: totals.revenue,
    ctr: totals.impressions > 0 ? totals.clicks / totals.impressions : 0,
    cvr: totals.clicks > 0 ? totals.conversions / totals.clicks : 0,
    cpa: totals.conversions > 0 ? totals.spend / totals.conversions : 0,
    roas: totals.spend > 0 ? totals.revenue / totals.spend : 0,
  }

  return { data: isLoading ? undefined : data, isLoading, error }
}

export function useFunnelByPlatform(dateRange: DateRange, _clientId: string | null, platforms: Platform[]) {
  const from = fmt(dateRange.from)
  const to = fmt(dateRange.to)
  const { data: rows = [], isLoading, error } = useWindsorRaw(from, to)

  const filtered = filterByPlatform(rows, platforms)

  const byPlatform = filtered.reduce<Record<string, { platform: string; impressions: number; clicks: number; conversions: number; spend: number; revenue: number }>>((acc, r) => {
    if (!acc[r.datasource]) acc[r.datasource] = { platform: r.datasource, impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 }
    acc[r.datasource].impressions += r.impressions
    acc[r.datasource].clicks += r.clicks
    acc[r.datasource].conversions += r.conversions
    acc[r.datasource].spend += r.spend
    acc[r.datasource].revenue += r.revenue
    return acc
  }, {})

  const data = Object.values(byPlatform)

  return { data, isLoading, error }
}
