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
  calcROAS, calcCPA, calcCTR, calcDelta,
  formatDisplayDate,
} from '@/lib/utils'

const PLATFORM_COLORS: Record<string, string> = {
  meta: '#3b82f6',
  google: '#ef4444',
  tiktok: '#ec4899',
  linkedin: '#0ea5e9',
}

type SortKey = 'spend' | 'revenue' | 'clicks' | 'conversions'

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
    {
      label: 'Total Spend',
      value: fmtCurrency(curr.spend),
      delta: calcDelta(curr.spend, prior.spend),
      lowerIsBetter: false,
    },
    {
      label: 'Revenue',
      value: fmtCurrency(curr.revenue),
      delta: calcDelta(curr.revenue, prior.revenue),
    },
    {
      label: 'ROAS',
      value: fmtMultiplier(calcROAS(curr.revenue, curr.spend)),
      delta: calcDelta(calcROAS(curr.revenue, curr.spend), calcROAS(prior.revenue, prior.spend)),
    },
    {
      label: 'CPA',
      value: curr.conversions > 0 ? fmtCurrency(calcCPA(curr.spend, curr.conversions)) : '—',
      delta: prior.conversions > 0 ? calcDelta(calcCPA(curr.spend, curr.conversions), calcCPA(prior.spend, prior.conversions)) : undefined,
      lowerIsBetter: true,
    },
    {
      label: 'Conversions',
      value: fmtNumber(curr.conversions),
      delta: calcDelta(curr.conversions, prior.conversions),
    },
    {
      label: 'Clicks',
      value: fmtNumber(curr.clicks),
      delta: calcDelta(curr.clicks, prior.clicks),
    },
  ] : []

  const sortedCampaigns = [...campaigns].sort((a, b) => b[sortKey] - a[sortKey])

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpiLoading
          ? Array.from({ length: 6 }).map((_, i) => <KPICard key={i} label="Loading" value="—" loading />)
          : kpiCards.map((card) => <KPICard key={card.label} {...card} />)
        }
      </div>

      {/* Trend Chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">Daily Spend &amp; Revenue</h2>
        {trendLoading ? (
          <PageLoader />
        ) : trend.length === 0 ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={trend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDisplayDate}
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => fmtCurrency(v)}
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                width={72}
              />
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                formatter={(value: number, name: string) => [fmtCurrency(value), name === 'spend' ? 'Spend' : 'Revenue']}
                labelFormatter={formatDisplayDate}
              />
              <Area type="monotone" dataKey="spend" stroke="#6366f1" fill="url(#spendGrad)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#revenueGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Platform Breakdown + Top Campaigns */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Platform Breakdown */}
        <div className="xl:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Platform Breakdown</h2>
          {platformLoading ? (
            <PageLoader />
          ) : platformData.length === 0 ? (
            <EmptyState />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={platformData} layout="vertical" margin={{ left: 8, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(v) => fmtCurrency(v)}
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="platform"
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                  tickFormatter={(v: string) => v.charAt(0).toUpperCase() + v.slice(1)}
                />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => fmtCurrency(v)}
                />
                <Bar dataKey="spend" radius={4}>
                  {platformData.map((entry) => (
                    <Cell key={entry.platform} fill={PLATFORM_COLORS[entry.platform] ?? '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {!platformLoading && platformData.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {platformData.map((p) => (
                <div key={p.platform} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: PLATFORM_COLORS[p.platform] ?? '#6366f1' }} />
                    <span className="text-gray-400 capitalize">{p.platform}</span>
                  </div>
                  <div className="flex gap-4 text-gray-500">
                    <span>ROAS {p.spend > 0 ? fmtMultiplier(p.revenue / p.spend) : '—'}</span>
                    <span className="text-gray-300">{fmtCurrency(p.spend)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Campaigns Table */}
        <div className="xl:col-span-3 bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-300">Top Campaigns</h2>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="bg-gray-950 border border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-400"
            >
              <option value="spend">By Spend</option>
              <option value="revenue">By Revenue</option>
              <option value="clicks">By Clicks</option>
              <option value="conversions">By Conversions</option>
            </select>
          </div>

          {campaignsLoading ? (
            <PageLoader />
          ) : sortedCampaigns.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-800">
                    {['Campaign', 'Platform', 'Spend', 'Revenue', 'ROAS', 'CTR', 'Conv.'].map((h) => (
                      <th key={h} className="text-left text-gray-500 font-medium pb-2 pr-3 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedCampaigns.map((c) => (
                    <tr
                      key={c.campaign_id}
                      onClick={() => navigate(`/dashboard/campaign/${c.campaign_id}`)}
                      className="border-b border-gray-800/50 hover:bg-gray-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-2 pr-3 text-gray-200 font-medium max-w-[160px] truncate">
                        {c.campaign_name || c.campaign_id}
                      </td>
                      <td className="py-2 pr-3">
                        <span
                          className="px-1.5 py-0.5 rounded text-xs font-medium capitalize"
                          style={{
                            background: (PLATFORM_COLORS[c.platform] ?? '#6366f1') + '20',
                            color: PLATFORM_COLORS[c.platform] ?? '#6366f1',
                          }}
                        >
                          {c.platform}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-gray-300 whitespace-nowrap">{fmtCurrency(c.spend)}</td>
                      <td className="py-2 pr-3 text-gray-300 whitespace-nowrap">{fmtCurrency(c.revenue)}</td>
                      <td className="py-2 pr-3 text-gray-300 whitespace-nowrap">
                        {c.spend > 0 ? fmtMultiplier(c.revenue / c.spend) : '—'}
                      </td>
                      <td className="py-2 pr-3 text-gray-300 whitespace-nowrap">
                        {fmtPercent(calcCTR(c.clicks, c.impressions))}
                      </td>
                      <td className="py-2 text-gray-300">{fmtNumber(c.conversions)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
