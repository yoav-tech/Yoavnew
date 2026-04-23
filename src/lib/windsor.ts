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

const FIELDS = 'date,datasource,account_name,campaign,clicks,spend,impressions,conversions,revenue'

export function normalizePlatform(datasource: string): string {
  const ds = (datasource ?? '').toLowerCase()
  if (ds.includes('facebook') || ds.includes('meta')) return 'meta'
  if (ds.includes('google')) return 'google'
  if (ds.includes('tiktok')) return 'tiktok'
  if (ds.includes('linkedin')) return 'linkedin'
  return ds.split('_')[0] || 'other'
}

export async function fetchWindsor(dateFrom: string, dateTo: string): Promise<WindsorRow[]> {
  const apiKey = import.meta.env.VITE_WINDSOR_API_KEY as string
  if (!apiKey) throw new Error('VITE_WINDSOR_API_KEY not set')

  const url = new URL('https://connectors.windsor.ai/all')
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('date_from', dateFrom)
  url.searchParams.set('date_to', dateTo)
  url.searchParams.set('fields', FIELDS)

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Windsor.ai API error: ${res.status}`)

  const json = await res.json()
  const rows: Record<string, unknown>[] = Array.isArray(json) ? json : (json.data ?? [])

  return rows.map((row) => ({
    date: String(row.date ?? ''),
    datasource: normalizePlatform(String(row.datasource ?? row.source ?? '')),
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
