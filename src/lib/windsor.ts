export interface WindsorRow {
  date: string
  datasource: string
  account_name: string
  campaign: string
  clicks: number
  spend: number
  impressions: number
  conversions: number
  revenue: number
}

// Fields that are confirmed to exist in Windsor.ai Google Ads connector.
// Optional metric fields (impressions, conversions, revenue) are requested
// but default to 0 if Windsor.ai doesn't return them.
const FIELDS = 'date,datasource,source,account_name,campaign,clicks,spend,impressions,conversions,revenue'

export function normalizePlatform(datasource: string, source?: string): string {
  // Windsor.ai uses both "datasource" and "source" — try both
  const raw = ((datasource || source) ?? '').toLowerCase()
  if (raw.includes('facebook') || raw.includes('meta')) return 'meta'
  if (raw.includes('google')) return 'google'
  if (raw.includes('tiktok')) return 'tiktok'
  if (raw.includes('linkedin')) return 'linkedin'
  // Fall back to the other field
  const alt = (source ?? '').toLowerCase()
  if (alt.includes('google')) return 'google'
  if (alt.includes('facebook') || alt.includes('meta')) return 'meta'
  if (alt.includes('tiktok')) return 'tiktok'
  if (alt.includes('linkedin')) return 'linkedin'
  return raw.split('_')[0] || 'other'
}

export async function fetchWindsor(dateFrom: string, dateTo: string): Promise<WindsorRow[]> {
  const apiKey = import.meta.env.VITE_WINDSOR_API_KEY as string
  if (!apiKey) throw new Error('VITE_WINDSOR_API_KEY is not configured in Vercel environment variables.')

  const url = new URL('https://connectors.windsor.ai/all')
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('date_from', dateFrom)
  url.searchParams.set('date_to', dateTo)
  url.searchParams.set('fields', FIELDS)

  const res = await fetch(url.toString())
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Windsor.ai API error ${res.status}: ${text.slice(0, 200)}`)
  }

  const json = await res.json()
  const rows: Record<string, unknown>[] = Array.isArray(json) ? json : (json.data ?? [])

  if (rows.length === 0) return []

  return rows.map((row) => ({
    date: String(row.date ?? ''),
    datasource: normalizePlatform(String(row.datasource ?? ''), String(row.source ?? '')),
    account_name: String(row.account_name ?? ''),
    campaign: String(row.campaign ?? ''),
    clicks: Number(row.clicks ?? 0),
    spend: Number(row.spend ?? 0),
    impressions: Number(row.impressions ?? 0),
    conversions: Number(row.conversions ?? 0),
    revenue: Number(row.revenue ?? 0),
  }))
}

export function sumMetrics(rows: WindsorRow[]) {
  return rows.reduce(
    (acc, r) => ({
      spend: acc.spend + r.spend,
      clicks: acc.clicks + r.clicks,
      impressions: acc.impressions + r.impressions,
      conversions: acc.conversions + r.conversions,
      revenue: acc.revenue + r.revenue,
    }),
    { spend: 0, clicks: 0, impressions: 0, conversions: 0, revenue: 0 }
  )
}
