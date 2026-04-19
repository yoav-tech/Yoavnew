import { useFilters } from '@/contexts/FiltersContext'
import { useFunnelMetrics, useFunnelByPlatform } from '@/hooks/useMetrics'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { fmtCompact, fmtPercent } from '@/lib/utils'

const PLATFORM_COLORS: Record<string, string> = {
  meta: '#3b82f6',
  google: '#ef4444',
  tiktok: '#ec4899',
  linkedin: '#0ea5e9',
}

const STAGES = ['impressions', 'clicks', 'leads', 'conversions'] as const
type Stage = typeof STAGES[number]

const STAGE_LABELS: Record<Stage, string> = {
  impressions: 'Impressions',
  clicks: 'Clicks',
  leads: 'Leads',
  conversions: 'Conversions',
}

const STAGE_COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#10b981']

function convRate(a: number, b: number) {
  return b > 0 ? (a / b) * 100 : 0
}

export function Funnel() {
  const { dateRange, clientId, platforms } = useFilters()
  const { data: funnel, isLoading } = useFunnelMetrics(dateRange, clientId, platforms)
  const { data: byPlatform = [], isLoading: platformLoading } = useFunnelByPlatform(dateRange, clientId, platforms)

  const maxValue = funnel ? Math.max(funnel.impressions, 1) : 1

  const rates = funnel
    ? [
        { label: 'Click-Through Rate', value: convRate(funnel.clicks, funnel.impressions) },
        { label: 'Lead Rate (from clicks)', value: convRate(funnel.leads, funnel.clicks) },
        { label: 'Conversion Rate (from leads)', value: convRate(funnel.conversions, funnel.leads) },
        { label: 'Overall Conv. Rate (imp → conv)', value: convRate(funnel.conversions, funnel.impressions) },
      ]
    : []

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <h1 className="text-lg font-bold text-gray-100">Conversion Funnel</h1>

      {isLoading ? (
        <PageLoader />
      ) : !funnel || funnel.impressions === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Funnel bars */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-gray-300 mb-6">Funnel Overview</h2>
            <div className="space-y-4">
              {STAGES.map((stage, i) => {
                const value = funnel[stage]
                const pct = (value / maxValue) * 100
                return (
                  <div key={stage}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-gray-300 font-medium">{STAGE_LABELS[stage]}</span>
                      <span className="text-sm font-bold text-gray-100">{fmtCompact(value)}</span>
                    </div>
                    <div className="h-8 bg-gray-800 rounded-lg overflow-hidden">
                      <div
                        className="h-full rounded-lg transition-all duration-500 flex items-center px-3"
                        style={{ width: `${Math.max(pct, 1)}%`, background: STAGE_COLORS[i] }}
                      >
                        {pct > 15 && (
                          <span className="text-xs text-white font-medium">{fmtPercent(pct, 0)} of top</span>
                        )}
                      </div>
                    </div>
                    {i < STAGES.length - 1 && (
                      <div className="flex items-center gap-1 mt-1.5 ml-1">
                        <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                        <span className="text-xs text-gray-500">
                          {fmtPercent(convRate(funnel[STAGES[i + 1]], value))} {STAGE_LABELS[STAGES[i + 1]].toLowerCase()} rate
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Conversion rates summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {rates.map((r) => (
              <div key={r.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="text-xs text-gray-500 mb-1">{r.label}</div>
                <div className="text-xl font-bold text-gray-100">{fmtPercent(r.value, 2)}</div>
              </div>
            ))}
          </div>

          {/* By platform */}
          {!platformLoading && byPlatform.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-gray-300 mb-4">By Platform</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-800">
                      {['Platform', 'Impressions', 'Clicks', 'CTR', 'Leads', 'Conversions', 'Conv. Rate'].map((h) => (
                        <th key={h} className="text-left text-gray-500 font-medium pb-2 pr-4 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {byPlatform.map((row) => (
                      <tr key={row.platform} className="border-b border-gray-800/50">
                        <td className="py-2.5 pr-4">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ background: PLATFORM_COLORS[row.platform] ?? '#6366f1' }} />
                            <span className="text-gray-200 capitalize font-medium">{row.platform}</span>
                          </div>
                        </td>
                        <td className="py-2.5 pr-4 text-gray-300">{fmtCompact(row.impressions)}</td>
                        <td className="py-2.5 pr-4 text-gray-300">{fmtCompact(row.clicks)}</td>
                        <td className="py-2.5 pr-4 text-gray-300">{fmtPercent(convRate(row.clicks, row.impressions))}</td>
                        <td className="py-2.5 pr-4 text-gray-300">{fmtCompact(row.leads)}</td>
                        <td className="py-2.5 pr-4 text-gray-300">{fmtCompact(row.conversions)}</td>
                        <td className="py-2.5 text-gray-300">{fmtPercent(convRate(row.conversions, row.clicks))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
