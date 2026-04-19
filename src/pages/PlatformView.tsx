import { useParams, useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useFilters } from '@/contexts/FiltersContext'
import { useKPISummary, useDailyTrend } from '@/hooks/useMetrics'
import { useTopCampaigns } from '@/hooks/useCampaigns'
import { KPICard } from '@/components/ui/KPICard'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  fmtCurrency, fmtNumber, fmtMultiplier, fmtPercent,
  calcROAS, calcCPA, calcCTR, calcDelta, formatDisplayDate,
} from '@/lib/utils'
import type { Platform } from '@/types/database'

const PLATFORM_META: Record<string, { label: string; color: string }> = {
  meta:     { label: 'Meta Ads',     color: '#3b82f6' },
  google:   { label: 'Google Ads',   color: '#ef4444' },
  tiktok:   { label: 'TikTok Ads',  color: '#ec4899' },
  linkedin: { label: 'LinkedIn Ads', color: '#0ea5e9' },
}

export function PlatformView() {
  const { platform } = useParams<{ platform: string }>()
  const { dateRange, clientId } = useFilters()
  const navigate = useNavigate()

  const platforms: Platform[] = platform ? [platform as Platform] : []
  const meta = PLATFORM_META[platform ?? ''] ?? { label: platform, color: '#6366f1' }

  const { data: kpi, isLoading: kpiLoading } = useKPISummary(dateRange, clientId, platforms)
  const { data: trend = [], isLoading: trendLoading } = useDailyTrend(dateRange, clientId, platforms)
  const { data: campaigns = [], isLoading: campaignsLoading } = useTopCampaigns(dateRange, clientId, platform ?? null, 20)

  const curr = kpi?.current
  const prior = kpi?.prior

  const kpiCards = curr && prior ? [
    { label: 'Spend', value: fmtCurrency(curr.spend), delta: calcDelta(curr.spend, prior.spend) },
    { label: 'Revenue', value: fmtCurrency(curr.revenue), delta: calcDelta(curr.revenue, prior.revenue) },
    { label: 'ROAS', value: fmtMultiplier(calcROAS(curr.revenue, curr.spend)), delta: calcDelta(calcROAS(curr.revenue, curr.spend), calcROAS(prior.revenue, prior.spend)) },
    { label: 'CPA', value: curr.conversions > 0 ? fmtCurrency(calcCPA(curr.spend, curr.conversions)) : '—', lowerIsBetter: true, delta: prior.conversions > 0 ? calcDelta(calcCPA(curr.spend, curr.conversions), calcCPA(prior.spend, prior.conversions)) : undefined },
    { label: 'Conversions', value: fmtNumber(curr.conversions), delta: calcDelta(curr.conversions, prior.conversions) },
    { label: 'Clicks', value: fmtNumber(curr.clicks), delta: calcDelta(curr.clicks, prior.clicks) },
  ] : []

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <span className="w-3 h-3 rounded-full" style={{ background: meta.color }} />
        <h1 className="text-lg font-bold text-gray-100">{meta.label}</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpiLoading
          ? Array.from({ length: 6 }).map((_, i) => <KPICard key={i} label="Loading" value="—" loading />)
          : kpiCards.map((c) => <KPICard key={c.label} {...c} />)
        }
      </div>

      {/* Trend chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">Daily Spend &amp; Revenue</h2>
        {trendLoading ? (
          <PageLoader />
        ) : trend.length === 0 ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="pSpendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={meta.color} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={meta.color} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="pRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" tickFormatter={formatDisplayDate} tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => fmtCurrency(v)} tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={72} />
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                formatter={(v: number, name: string) => [fmtCurrency(v), name === 'spend' ? 'Spend' : 'Revenue']}
                labelFormatter={formatDisplayDate}
              />
              <Area type="monotone" dataKey="spend" stroke={meta.color} fill="url(#pSpendGrad)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#pRevGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Campaign table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">Campaigns</h2>
        {campaignsLoading ? (
          <PageLoader />
        ) : campaigns.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Campaign', 'Spend', 'Revenue', 'ROAS', 'Clicks', 'CTR', 'Conv.', 'CPA'].map((h) => (
                    <th key={h} className="text-left text-gray-500 font-medium pb-2 pr-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr
                    key={c.campaign_id}
                    onClick={() => navigate(`/dashboard/campaign/${c.campaign_id}`)}
                    className="border-b border-gray-800/50 hover:bg-gray-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-2 pr-4 text-gray-200 font-medium max-w-[200px] truncate">
                      {c.campaign_name || c.campaign_id}
                    </td>
                    <td className="py-2 pr-4 text-gray-300 whitespace-nowrap">{fmtCurrency(c.spend)}</td>
                    <td className="py-2 pr-4 text-gray-300 whitespace-nowrap">{fmtCurrency(c.revenue)}</td>
                    <td className="py-2 pr-4 text-gray-300 whitespace-nowrap">
                      {c.spend > 0 ? fmtMultiplier(c.revenue / c.spend) : '—'}
                    </td>
                    <td className="py-2 pr-4 text-gray-300 whitespace-nowrap">{fmtNumber(c.clicks)}</td>
                    <td className="py-2 pr-4 text-gray-300 whitespace-nowrap">
                      {fmtPercent(calcCTR(c.clicks, c.impressions))}
                    </td>
                    <td className="py-2 pr-4 text-gray-300">{fmtNumber(c.conversions)}</td>
                    <td className="py-2 text-gray-300 whitespace-nowrap">
                      {c.conversions > 0 ? fmtCurrency(calcCPA(c.spend, c.conversions)) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
