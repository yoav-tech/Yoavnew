import { useFilters } from '@/contexts/FiltersContext'
import { useFunnelMetrics, useFunnelByPlatform } from '@/hooks/useMetrics'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { fmtCompact, fmtPercent } from '@/lib/utils'

const PLATFORM_COLORS: Record<string, string> = {
  meta:     '#1877F2',
  google:   '#EA4335',
  tiktok:   '#FE2C55',
  linkedin: '#0A66C2',
}

const STAGES = ['impressions', 'clicks', 'leads', 'conversions'] as const
type Stage = typeof STAGES[number]

const STAGE_META: Record<Stage, { label: string; color: string }> = {
  impressions: { label: 'Impressions', color: '#7C3AED' },
  clicks:      { label: 'Clicks',      color: '#6D28D9' },
  leads:       { label: 'Leads',       color: '#5B21B6' },
  conversions: { label: 'Conversions', color: '#4C1D95' },
}

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
        { label: 'Click-Through',          value: convRate(funnel.clicks, funnel.impressions) },
        { label: 'Lead Rate',              value: convRate(funnel.leads, funnel.clicks) },
        { label: 'Conversion Rate',        value: convRate(funnel.conversions, funnel.leads) },
        { label: 'End-to-End Conv. Rate',  value: convRate(funnel.conversions, funnel.impressions) },
      ]
    : []

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1200px] mx-auto">
      <div>
        <h1 className="text-base font-bold text-zinc-100 font-display">Conversion Funnel</h1>
        <p className="text-xs text-zinc-500 mt-0.5">End-to-end journey from impression to conversion</p>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : !funnel || funnel.impressions === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Funnel bars */}
            <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-zinc-200 mb-6">Funnel Stages</h2>
              <div className="space-y-5">
                {STAGES.map((stage, i) => {
                  const value = funnel[stage]
                  const pct = (value / maxValue) * 100
                  const { label, color } = STAGE_META[stage]
                  const dropOffRate = i < STAGES.length - 1
                    ? convRate(funnel[STAGES[i + 1]], value)
                    : null

                  return (
                    <div key={stage}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                          <span className="text-sm font-medium text-zinc-300">{label}</span>
                        </div>
                        <div className="flex items-center gap-3 text-right">
                          <span className="text-xs text-zinc-500 tabular">{fmtPercent(pct, 0)} of top</span>
                          <span className="text-sm font-bold text-zinc-100 font-display tabular">{fmtCompact(value)}</span>
                        </div>
                      </div>
                      <div className="h-6 bg-zinc-800 rounded-lg overflow-hidden">
                        <div
                          className="h-full rounded-lg transition-all duration-700 ease-out"
                          style={{ width: `${Math.max(pct, 0.5)}%`, background: color }}
                        />
                      </div>
                      {dropOffRate !== null && (
                        <div className="flex items-center gap-1.5 mt-2 ml-4">
                          <svg className="w-3 h-3 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                          <span className="text-[11px] text-zinc-600">
                            {fmtPercent(dropOffRate)} → {STAGE_META[STAGES[i + 1]].label.toLowerCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Rate cards */}
            <div className="flex flex-col gap-3">
              {rates.map((r) => (
                <div key={r.label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex-1">
                  <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">{r.label}</p>
                  <p className="text-2xl font-bold text-zinc-100 font-display tabular">{fmtPercent(r.value, 2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* By platform */}
          {!platformLoading && byPlatform.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-zinc-200 mb-4">By Platform</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      {['Platform', 'Impressions', 'Clicks', 'CTR', 'Leads', 'Conversions', 'Conv. Rate'].map((h) => (
                        <th key={h} className="text-left text-zinc-500 font-semibold pb-2.5 pr-4 whitespace-nowrap uppercase tracking-wider text-[10px]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {byPlatform.map((row) => (
                      <tr key={row.platform}>
                        <td className="py-2.5 pr-4">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ background: PLATFORM_COLORS[row.platform] ?? '#7C3AED' }} />
                            <span className="text-zinc-200 capitalize font-medium">{row.platform}</span>
                          </div>
                        </td>
                        <td className="py-2.5 pr-4 text-zinc-300 tabular">{fmtCompact(row.impressions)}</td>
                        <td className="py-2.5 pr-4 text-zinc-300 tabular">{fmtCompact(row.clicks)}</td>
                        <td className="py-2.5 pr-4 text-zinc-300 tabular">{fmtPercent(convRate(row.clicks, row.impressions))}</td>
                        <td className="py-2.5 pr-4 text-zinc-300 tabular">{fmtCompact(row.leads)}</td>
                        <td className="py-2.5 pr-4 text-zinc-300 tabular">{fmtCompact(row.conversions)}</td>
                        <td className="py-2.5 text-zinc-300 tabular">{fmtPercent(convRate(row.conversions, row.clicks))}</td>
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
