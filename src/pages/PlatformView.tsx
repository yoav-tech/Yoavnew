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

const PLATFORM_META: Record<string, { label: string; color: string; bg: string }> = {
  meta:     { label: 'Meta Ads',     color: '#1877F2', bg: '#1877F218' },
  google:   { label: 'Google Ads',   color: '#EA4335', bg: '#EA433518' },
  tiktok:   { label: 'TikTok Ads',   color: '#FE2C55', bg: '#FE2C5518' },
  linkedin: { label: 'LinkedIn Ads', color: '#0A66C2', bg: '#0A66C218' },
}

export function PlatformView() {
  const { platform } = useParams<{ platform: string }>()
  const { dateRange, clientId } = useFilters()
  const navigate = useNavigate()

  const platforms: Platform[] = platform ? [platform as Platform] : []
  const meta = PLATFORM_META[platform ?? ''] ?? { label: platform ?? 'Platform', color: '#7C3AED', bg: '#7C3AED18' }

  const { data: kpi, isLoading: kpiLoading } = useKPISummary(dateRange, clientId, platforms)
  const { data: trend = [], isLoading: trendLoading } = useDailyTrend(dateRange, clientId, platforms)
  const { data: campaigns = [], isLoading: campaignsLoading } = useTopCampaigns(dateRange, clientId, platform ?? null, 20)

  const curr = kpi?.current
  const prior = kpi?.prior

  const kpiCards = curr && prior ? [
    { label: 'Spend',       value: fmtCurrency(curr.spend),       delta: calcDelta(curr.spend, prior.spend) },
    { label: 'Revenue',     value: fmtCurrency(curr.revenue),     delta: calcDelta(curr.revenue, prior.revenue) },
    { label: 'ROAS',        value: fmtMultiplier(calcROAS(curr.revenue, curr.spend)), delta: calcDelta(calcROAS(curr.revenue, curr.spend), calcROAS(prior.revenue, prior.spend)) },
    { label: 'CPA',         value: curr.conversions > 0 ? fmtCurrency(calcCPA(curr.spend, curr.conversions)) : '—', lowerIsBetter: true, delta: prior.conversions > 0 ? calcDelta(calcCPA(curr.spend, curr.conversions), calcCPA(prior.spend, prior.conversions)) : undefined },
    { label: 'Conversions', value: fmtNumber(curr.conversions),   delta: calcDelta(curr.conversions, prior.conversions) },
    { label: 'Clicks',      value: fmtNumber(curr.clicks),        delta: calcDelta(curr.clicks, prior.clicks) },
  ] : []

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1600px] mx-auto">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: meta.bg }}>
          <span className="w-3 h-3 rounded-full" style={{ background: meta.color }} />
        </div>
        <div>
          <h1 className="text-base font-bold text-zinc-100 font-display">{meta.label}</h1>
          <p className="text-xs text-zinc-500">Platform performance overview</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpiLoading
          ? Array.from({ length: 6 }).map((_, i) => <KPICard key={i} label="Loading" value="—" loading />)
          : kpiCards.length > 0
            ? kpiCards.map((c) => <KPICard key={c.label} {...c} />)
            : Array.from({ length: 6 }).map((_, i) => <KPICard key={i} label="—" value="—" />)
        }
      </div>

      {/* Trend chart */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-zinc-200 mb-4">Daily Performance</h2>
        {trendLoading ? (
          <PageLoader />
        ) : trend.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="pSpendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={meta.color} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={meta.color} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="pRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                <XAxis dataKey="date" tickFormatter={formatDisplayDate} tick={{ fontSize: 11, fill: '#52525B' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => fmtCurrency(v)} tick={{ fontSize: 11, fill: '#52525B' }} axisLine={false} tickLine={false} width={68} />
                <Tooltip
                  contentStyle={{ background: '#18181B', border: '1px solid #27272A', borderRadius: 10, fontSize: 12, color: '#E4E4E7' }}
                  formatter={(v: number, name: string) => [fmtCurrency(v), name === 'spend' ? 'Spend' : 'Revenue']}
                  labelFormatter={formatDisplayDate}
                />
                <Area type="monotone" dataKey="spend" stroke={meta.color} fill="url(#pSpendGrad)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#pRevGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-zinc-800">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: meta.color }} />
                <span className="text-xs text-zinc-500">Spend</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#10b981' }} />
                <span className="text-xs text-zinc-500">Revenue</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Campaign table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-zinc-200 mb-4">Campaigns</h2>
        {campaignsLoading ? (
          <PageLoader />
        ) : campaigns.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800">
                  {['Campaign', 'Spend', 'Revenue', 'ROAS', 'Clicks', 'CTR', 'Conv.', 'CPA'].map((h) => (
                    <th key={h} className="text-left text-zinc-500 font-semibold pb-2.5 pr-4 whitespace-nowrap uppercase tracking-wider text-[10px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {campaigns.map((c) => (
                  <tr
                    key={c.campaign_id}
                    onClick={() => navigate(`/dashboard/campaign/${c.campaign_id}`)}
                    className="hover:bg-zinc-800/40 cursor-pointer transition-colors group"
                  >
                    <td className="py-2.5 pr-4 text-zinc-200 font-medium max-w-[220px] truncate group-hover:text-zinc-100">
                      {c.campaign_name || c.campaign_id}
                    </td>
                    <td className="py-2.5 pr-4 text-zinc-300 tabular whitespace-nowrap">{fmtCurrency(c.spend)}</td>
                    <td className="py-2.5 pr-4 text-zinc-300 tabular whitespace-nowrap">{fmtCurrency(c.revenue)}</td>
                    <td className="py-2.5 pr-4 text-zinc-300 tabular whitespace-nowrap">
                      {c.spend > 0 ? fmtMultiplier(c.revenue / c.spend) : '—'}
                    </td>
                    <td className="py-2.5 pr-4 text-zinc-300 tabular whitespace-nowrap">{fmtNumber(c.clicks)}</td>
                    <td className="py-2.5 pr-4 text-zinc-300 tabular whitespace-nowrap">{fmtPercent(calcCTR(c.clicks, c.impressions))}</td>
                    <td className="py-2.5 pr-4 text-zinc-300 tabular">{fmtNumber(c.conversions)}</td>
                    <td className="py-2.5 text-zinc-300 tabular whitespace-nowrap">
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
