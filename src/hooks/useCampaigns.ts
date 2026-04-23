import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { fetchWindsor } from '@/lib/windsor'
import type { DateRange } from '@/contexts/FiltersContext'

function fmt(d: Date) { return format(d, 'yyyy-MM-dd') }

export function useTopCampaigns(
  dateRange: DateRange,
  _clientId: string | null,
  platform: string | null = null,
  limit = 10,
) {
  const from = fmt(dateRange.from)
  const to = fmt(dateRange.to)

  return useQuery({
    queryKey: ['windsor', from, to],
    queryFn: () => fetchWindsor(from, to),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    select: (rows) => {
      const filtered = platform ? rows.filter((r) => r.datasource === platform) : rows

      const byCampaign = filtered.reduce<Record<string, {
        campaign_id: string
        campaign_name: string
        platform: string
        spend: number
        revenue: number
        clicks: number
        impressions: number
        conversions: number
      }>>((acc, r) => {
        const key = `${r.datasource}::${r.campaign}`
        if (!acc[key]) acc[key] = {
          campaign_id: key,
          campaign_name: r.campaign,
          platform: r.datasource,
          spend: 0, revenue: 0, clicks: 0, impressions: 0, conversions: 0,
        }
        acc[key].spend += r.spend
        acc[key].revenue += r.revenue
        acc[key].clicks += r.clicks
        acc[key].impressions += r.impressions
        acc[key].conversions += r.conversions
        return acc
      }, {})

      return Object.values(byCampaign)
        .sort((a, b) => b.spend - a.spend)
        .slice(0, limit)
    },
  })
}

export function useCampaignHierarchy(campaignId: string | undefined, dateRange: DateRange) {
  const from = fmt(dateRange.from)
  const to = fmt(dateRange.to)

  return useQuery({
    queryKey: ['windsor', from, to],
    queryFn: () => fetchWindsor(from, to),
    staleTime: 5 * 60 * 1000,
    enabled: !!campaignId,
    select: (rows) => {
      if (!campaignId) return null
      const [platform, campaignName] = campaignId.split('::')
      const campaignRows = rows.filter((r) => r.datasource === platform && r.campaign === campaignName)

      const totals = campaignRows.reduce(
        (acc, r) => ({ spend: acc.spend + r.spend, revenue: acc.revenue + r.revenue, clicks: acc.clicks + r.clicks, impressions: acc.impressions + r.impressions, conversions: acc.conversions + r.conversions }),
        { spend: 0, revenue: 0, clicks: 0, impressions: 0, conversions: 0 }
      )

      return {
        campaign_id: campaignId,
        campaign_name: campaignName,
        platform,
        ...totals,
        adsets: [],
      }
    },
  })
}
