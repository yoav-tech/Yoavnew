import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { useFilters } from '@/contexts/FiltersContext'
import { useKPISummary, useDailyTrend, usePlatformBreakdown } from '@/hooks/useMetrics'
import { useTopCampaigns } from '@/hooks/useCampaigns'
import { KPICard } from '@/components/ui/KPICard'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  fmtCurrency, fmtNumber, fmtMultiplier, fmtPercent,
  calcROAS, calcCPA, calcCTR, calcDelta, formatDisplayDate,
} from '@/lib/utils'

const PLATFORM_COLORS: Record<string, string> = {
  meta:     '#1877F2',
  google:   '#EA4335',
  tiktok:   '#FE2C55',
  linkedin: '#0A66C2',
}

type SortKey = 'spend' | 'revenue' | 'clicks' | 'conversions'

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-sm font-semibold text-zinc-200">{title}</h2>
      {action}
    </div>
  )
}

export function Dashboard() {
  const { dateRange, clientId, platforms } = useFilters()
  const navigate = useNavigate()
  const [sortKey, setSortKey] = useState<SortKey>('spend')

  const { data: kpi, isLoading: kpiLoading } = useKPISummary(dateRange, clientId, platforms)
  const { data: trend = [], isLoading: trendLoading } = useDailyTrend(dateRange, clientId, platforms)
  const { data: platformData = [], isLoading: platformLoading } = usePlatformBreakdown(dateRange, clientId)
  const { data: campaigns = [], isLoading: campaignsLoading } = useTopCampaigns(dateRange, clientId, null, 10)

  const curr = kpi?.current
  const prior = kpi?.prior

  const kpiCards = curr && prior ? [
    { label: 'Total Spend', value: fmtCurrency(curr.spend), delta: calcDelta(curr.spend, prior.spend) },
    { label: 'Revenue', value: fmtCurrency(curr.revenue), delta: calcDelta(curr.revenue, prior.revenue) },
    { label: 'ROAS', value: fmtMultiplier(calcROAS(curr.revenue, curr.spend)), delta: calcDelta(calcROAS(curr.revenue, curr.spend), calcROAS(prior.revenue, prior.spend)) },
    { label: 'CPA', value: curr.conversions > 0 ? fmtCurrency(calcCPA(curr.spend, curr.conversions)) : '—', lowerIsBetter: true, delta: prior.conversions > 0 ? calcDelta(calcCPA(curr.spend, curr.conversions), calcCPA(prior.spend, prior.conversions)) : undefined },
    { label: 'Conversions', value: fmtNumber(curr.conversions), delta: calcDelta(curr.conversions, prior.conversions) },
    { label: 'Clicks', value: fmtNumber(curr.clicks), delta: calcDelta(curr.clicks, prior.clicks) },
  ] : []

  const sortedCampaigns = [...campaigns].sort((a, b) => b[sortKey] - a[sortKey])

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1600px] mx-auto">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpiLoading
          ? Array.from({ length: 6 }).map((_, i) => <KPICard key={i} label="Loading" value="—" loading />)
          : kpiCards.length > 0
            ? kpiCards.map((card) => <KPICard key={card.label} {...card} />)
            : Array.from({ length: 6 }).map((_, i) => <KPICard key={i} label="—" value="—" />)
        }
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Trend chart — 2/3 width */}
        <div className="xl:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <SectionHeader title="Daily Performance" />
          {trendLoading ? (
            <PageLoader />
          ) : trend.length === 0 ? (
            <EmptyState />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDisplayDate}
                  tick={{ fontSize: 11, fill: '#52525B' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => fmtCurrency(v)}
                  tick={{ fontSize: 11, fill: '#52525B' }}
                  axisLine={false}
                  tickLine={false}
                  width={68}
                />
                <Tooltip
                  contentStyle={{ background: '#18181B', border: '1px solid #27272A', borderRadius: 10, fontSize: 12, color: '#E4E4E7' }}
                  formatter={(value: number, name: string) => [fmtCurrency(value), name === 'spend' ? 'Spend' : 'Revenue']}
                  labelFormatter={formatDisplayDate}
                />
                <Area type="monotone" dataKey="spend" stroke="#7C3AED" fill="url(#spendGrad)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#revenueGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
          {!trendLoading && trend.length > 0 && (
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-zinc-800">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#7C3AED' }} />
                <span className="text-xs text-zinc-500">Spend</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#10b981' }} />
                <span className="text-xs text-zinc-500">Revenue</span>
              </div>
            </div>
          )}
        </div>

        {/* Platform breakdown — 1/3 width */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <SectionHeader title="Platform Spend" />
          {platformLoading ? (
            <PageLoader />
          ) : platformData.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={platformData} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                  <XAxis
                    type="number"
                    tickFormatter={(v) => fmtCurrency(v)}
                    tick={{ fontSize: 10, fill: '#52525B' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="platform"
                    tick={{ fontSize: 11, fill: '#A1A1AA' }}
                    axisLine={false}
                    tickLine={false}
                    width={54}
                    tickFormatter={(v: string) => v.charAt(0).toUpperCase() + v.slice(1)}
                  />
                  <Tooltip
                    contentStyle={{ background: '#18181B', border: '1px solid #27272A', borderRadius: 10, fontSize: 12, color: '#E4E4E7' }}
                    formatter={(v: number) => [fmtCurrency(v), 'Spend']}
                  />
                  <Bar dataKey="spend" radius={4} maxBarSize={24}>
                    {platformData.map((entry) => (
                      <Cell key={entry.platform} fill={PLATFORM_COLORS[entry.platform] ?? '#7C3AED'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2.5">
                {platformData.map((p) => {
                  const roas = p.spend > 0 ? p.revenue / p.spend : 0
                  return (
                    <div key={p.platform} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: PLATFORM_COLORS[p.platform] ?? '#7C3AED' }} />
                        <span className="text-xs text-zinc-400 capitalize">{p.platform}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-zinc-500">ROAS {roas > 0 ? fmtMultiplier(roas) : '—'}</span>
                        <span className="text-zinc-300 font-medium tabular">{fmtCurrency(p.spend)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Top Campaigns Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <SectionHeader
          title="Top Campaigns"
          action={
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="h-7 pl-2.5 pr-6 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-zinc-400 focus:outline-none appearance-none cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2371717A' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center' }}
            >
              <option value="spend">By Spend</option>
              <option value="revenue">By Revenue</option>
              <option value="clicks">By Clicks</option>
              <option value="conversions">By Conversions</option>
            </select>
          }
        />
        {campaignsLoading ? (
          <PageLoader />
        ) : sortedCampaigns.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800">
                  {['Campaign', 'Platform', 'Spend', 'Revenue', 'ROAS', 'CTR', 'Conv.'].map((h) => (
                    <th key={h} className="text-left text-zinc-500 font-semibold pb-2.5 pr-4 whitespace-nowrap uppercase tracking-wider text-[10px]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {sortedCampaigns.map((c) => {
                  const color = PLATFORM_COLORS[c.platform] ?? '#7C3AED'
                  return (
                    <tr
                      key={c.campaign_id}
                      onClick={() => navigate(`/dashboard/campaign/${c.campaign_id}`)}
                      className="hover:bg-zinc-800/40 cursor-pointer transition-colors group"
                    >
                      <td className="py-2.5 pr-4 text-zinc-200 font-medium max-w-[200px] truncate group-hover:text-zinc-100">
                        {c.campaign_name || c.campaign_id}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold capitalize"
                          style={{ background: color + '18', color }}
                        >
                          {c.platform}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-zinc-300 tabular whitespace-nowrap">{fmtCurrency(c.spend)}</td>
                      <td className="py-2.5 pr-4 text-zinc-300 tabular whitespace-nowrap">{fmtCurrency(c.revenue)}</td>
                      <td className="py-2.5 pr-4 text-zinc-300 tabular whitespace-nowrap">
                        {c.spend > 0 ? fmtMultiplier(c.revenue / c.spend) : '—'}
                      </td>
                      <td className="py-2.5 pr-4 text-zinc-300 tabular whitespace-nowrap">
                        {fmtPercent(calcCTR(c.clicks, c.impressions))}
                      </td>
                      <td className="py-2.5 text-zinc-300 tabular">{fmtNumber(c.conversions)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
