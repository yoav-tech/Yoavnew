export type Platform = 'meta' | 'google' | 'tiktok' | 'linkedin'
export type UserRole = 'admin' | 'client'
export type SyncType = 'scheduled' | 'manual'
export type SyncStatus = 'started' | 'completed' | 'failed'

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          name: string
          slug: string
          contact_email: string | null
          created_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          name: string
          slug: string
          contact_email?: string | null
          created_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          contact_email?: string | null
          created_at?: string
          is_active?: boolean
        }
        Relationships: []
      }
      ad_accounts: {
        Row: {
          id: string
          client_id: string
          platform: Platform
          account_name: string
          platform_account_id: string
          currency: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          platform: Platform
          account_name: string
          platform_account_id: string
          currency?: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          platform?: Platform
          account_name?: string
          platform_account_id?: string
          currency?: string
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      daily_metrics: {
        Row: {
          id: number
          ad_account_id: string
          date: string
          campaign_id: string
          campaign_name: string | null
          adset_id: string
          adset_name: string | null
          ad_id: string
          ad_name: string | null
          impressions: number
          clicks: number
          spend: number
          conversions: number
          revenue: number
          leads: number
          video_views: number
          reach: number
          created_at: string
        }
        Insert: {
          id?: number
          ad_account_id: string
          date: string
          campaign_id?: string
          campaign_name?: string | null
          adset_id?: string
          adset_name?: string | null
          ad_id?: string
          ad_name?: string | null
          impressions?: number
          clicks?: number
          spend?: number
          conversions?: number
          revenue?: number
          leads?: number
          video_views?: number
          reach?: number
          created_at?: string
        }
        Update: {
          ad_account_id?: string
          date?: string
          campaign_id?: string
          campaign_name?: string | null
          adset_id?: string
          adset_name?: string | null
          ad_id?: string
          ad_name?: string | null
          impressions?: number
          clicks?: number
          spend?: number
          conversions?: number
          revenue?: number
          leads?: number
          video_views?: number
          reach?: number
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          id: string
          role: UserRole
          client_id: string | null
          display_name: string | null
          created_at: string
        }
        Insert: {
          id: string
          role?: UserRole
          client_id?: string | null
          display_name?: string | null
          created_at?: string
        }
        Update: {
          role?: UserRole
          client_id?: string | null
          display_name?: string | null
          created_at?: string
        }
        Relationships: []
      }
      sync_log: {
        Row: {
          id: number
          sync_type: SyncType
          status: SyncStatus
          started_at: string
          completed_at: string | null
          rows_synced: number
          error_message: string | null
        }
        Insert: {
          id?: number
          sync_type: SyncType
          status: SyncStatus
          started_at?: string
          completed_at?: string | null
          rows_synced?: number
          error_message?: string | null
        }
        Update: {
          sync_type?: SyncType
          status?: SyncStatus
          started_at?: string
          completed_at?: string | null
          rows_synced?: number
          error_message?: string | null
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      get_kpi_summary: {
        Args: {
          p_date_from: string
          p_date_to: string
          p_client_id: string | null
          p_platforms: string[] | null
        }
        Returns: unknown
      }
      get_daily_trend: {
        Args: {
          p_date_from: string
          p_date_to: string
          p_client_id: string | null
          p_platforms: string[] | null
        }
        Returns: unknown
      }
      get_platform_breakdown: {
        Args: {
          p_date_from: string
          p_date_to: string
          p_client_id: string | null
        }
        Returns: unknown
      }
      get_top_campaigns: {
        Args: {
          p_date_from: string
          p_date_to: string
          p_client_id: string | null
          p_platform: string | null
          p_limit: number
        }
        Returns: unknown
      }
      get_campaign_hierarchy: {
        Args: {
          p_campaign_id: string
          p_date_from: string
          p_date_to: string
        }
        Returns: unknown
      }
      get_funnel_metrics: {
        Args: {
          p_date_from: string
          p_date_to: string
          p_client_id: string | null
          p_platforms: string[] | null
        }
        Returns: unknown
      }
      get_funnel_by_platform: {
        Args: {
          p_date_from: string
          p_date_to: string
          p_client_id: string | null
          p_platforms: string[] | null
        }
        Returns: unknown
      }
      refresh_materialized_views: {
        Args: Record<string, never>
        Returns: undefined
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// Convenience row types
export type Client = Database['public']['Tables']['clients']['Row']
export type AdAccount = Database['public']['Tables']['ad_accounts']['Row']
export type DailyMetric = Database['public']['Tables']['daily_metrics']['Row']
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type SyncLog = Database['public']['Tables']['sync_log']['Row']

// RPC return types (cast from unknown in hooks)
export interface KPIPeriod {
  spend: number
  revenue: number
  clicks: number
  impressions: number
  conversions: number
  leads: number
}

export interface KPISummaryResult {
  current: KPIPeriod
  prior: KPIPeriod
}

export interface DailyTrendRow {
  date: string
  spend: number
  revenue: number
  clicks: number
  conversions: number
}

export interface PlatformBreakdownRow {
  platform: string
  spend: number
  revenue: number
  clicks: number
  impressions: number
  conversions: number
  leads: number
}

export interface CampaignRow {
  campaign_id: string
  campaign_name: string
  platform: string
  account_name: string
  spend: number
  revenue: number
  clicks: number
  impressions: number
  conversions: number
  leads: number
}

export interface AdSetRow {
  adset_id: string
  adset_name: string
  spend: number
  revenue: number
  clicks: number
  impressions: number
  conversions: number
  leads: number
}

export interface AdRow {
  ad_id: string
  ad_name: string
  adset_id: string
  spend: number
  revenue: number
  clicks: number
  impressions: number
  conversions: number
  leads: number
}

export interface CampaignHierarchy {
  campaign: CampaignRow
  adsets: Array<{ adset: AdSetRow; ads: AdRow[] }>
}

export interface FunnelMetrics {
  impressions: number
  clicks: number
  leads: number
  conversions: number
}

export interface FunnelByPlatformRow {
  platform: string
  impressions: number
  clicks: number
  leads: number
  conversions: number
}
