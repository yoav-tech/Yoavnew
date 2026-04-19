import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import type { DateRange } from '@/contexts/FiltersContext'
import type { CampaignRow, CampaignHierarchy } from '@/types/database'

export function useTopCampaigns(
  dateRange: DateRange,
  clientId: string | null,
  platform: string | null = null,
  limit = 10,
) {
  return useQuery({
    queryKey: [
      'top-campaigns',
      format(dateRange.from, 'yyyy-MM-dd'),
      format(dateRange.to, 'yyyy-MM-dd'),
      clientId,
      platform,
      limit,
    ],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_top_campaigns', {
        p_date_from: format(dateRange.from, 'yyyy-MM-dd'),
        p_date_to: format(dateRange.to, 'yyyy-MM-dd'),
        p_client_id: clientId,
        p_platform: platform,
        p_limit: limit,
      })
      if (error) throw error
      return (data ?? []) as unknown as CampaignRow[]
    },
  })
}

export function useCampaignHierarchy(campaignId: string | undefined, dateRange: DateRange) {
  return useQuery({
    queryKey: [
      'campaign-hierarchy',
      campaignId,
      format(dateRange.from, 'yyyy-MM-dd'),
      format(dateRange.to, 'yyyy-MM-dd'),
    ],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_campaign_hierarchy', {
        p_campaign_id: campaignId!,
        p_date_from: format(dateRange.from, 'yyyy-MM-dd'),
        p_date_to: format(dateRange.to, 'yyyy-MM-dd'),
      })
      if (error) throw error
      return data as unknown as CampaignHierarchy
    },
    enabled: !!campaignId,
  })
}
