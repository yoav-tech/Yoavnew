import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useFilters } from '@/contexts/FiltersContext'
import { useCampaignHierarchy } from '@/hooks/useCampaigns'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { fmtCurrency, fmtNumber, fmtMultiplier, fmtPercent, calcCTR, calcCPA } from '@/lib/utils'
import type { AdSetRow, AdRow } from '@/types/database'

const PLATFORM_COLORS: Record<string, string> = {
  meta:     '#1877F2',
  google:   '#EA4335',
  tiktok:   '#FE2C55',
  linkedin: '#0A66C2',
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">{label}</span>
      <span className="text-sm font-semibold text-zinc-200 tabular">{value}</span>
    </div>
  )
}

function AdSetAccordion({ adset, ads }: { adset: AdSetRow; ads: AdRow[] }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-zinc-800/30 hover:bg-zinc-800/60 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <svg
            className={`w-3.5 h-3.5 text-zinc-600 flex-shrink-0 transition-transform duration-150 ${open ? 'rotate-90' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-sm font-medium text-zinc-200 truncate">
            {adset.adset_name || adset.adset_id}
          </span>
        </div>
        <div className="flex items-center gap-5 text-xs text-zinc-400 flex-shrink-0 ml-4">
          <span className="tabular">{fmtCurrency(adset.spend)}</span>
          <span className="hidden sm:block">ROAS {adset.spend > 0 ? fmtMultiplier(adset.revenue / adset.spend) : '—'}</span>
          <span className="tabular">{fmtNumber(adset.conversions)} conv.</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-zinc-800 divide-y divide-zinc-800/50">
          {ads.length === 0 ? (
            <p className="px-5 py-3 text-xs text-zinc-600">No ad-level data</p>
          ) : (
            ads.map((ad) => (
              <div key={ad.ad_id} className="px-5 py-3.5">
                <p className="text-xs font-medium text-zinc-300 truncate mb-3">{ad.ad_name || ad.ad_id}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3">
                  {[
                    { label: 'Spend',   value: fmtCurrency(ad.spend) },
                    { label: 'Revenue', value: fmtCurrency(ad.revenue) },
                    { label: 'ROAS',    value: ad.spend > 0 ? fmtMultiplier(ad.revenue / ad.spend) : '—' },
                    { label: 'Clicks',  value: fmtNumber(ad.clicks) },
                    { label: 'CTR',     value: fmtPercent(calcCTR(ad.clicks, ad.impressions)) },
                    { label: 'Conv.',   value: fmtNumber(ad.conversions) },
                    { label: 'CPA',     value: ad.conversions > 0 ? fmtCurrency(calcCPA(ad.spend, ad.conversions)) : '—' },
                    { label: 'Leads',   value: fmtNumber(ad.leads) },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-xs">
                      <span className="text-zinc-500">{label}</span>
                      <span className="text-zinc-300 font-medium tabular">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export function CampaignDrillDown() {
  const { campaignId } = useParams<{ campaignId: string }>()
  const { dateRange } = useFilters()
  const navigate = useNavigate()
  const { data, isLoading } = useCampaignHierarchy(campaignId, dateRange)

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1200px] mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-200 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {isLoading ? (
        <PageLoader />
      ) : !data?.campaign ? (
        <EmptyState title="Campaign not found" description="No data for this campaign in the selected date range." />
      ) : (
        <>
          {/* Campaign summary card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h1 className="text-lg font-bold text-zinc-100 font-display">
                  {data.campaign.campaign_name || data.campaign.campaign_id}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-zinc-500">{data.campaign.account_name}</span>
                  <span className="text-zinc-700">·</span>
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold capitalize"
                    style={{
                      background: (PLATFORM_COLORS[data.campaign.platform] ?? '#7C3AED') + '18',
                      color: PLATFORM_COLORS[data.campaign.platform] ?? '#7C3AED',
                    }}
                  >
                    {data.campaign.platform}
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-x-6 gap-y-4 pt-4 border-t border-zinc-800">
              <StatPill label="Spend"   value={fmtCurrency(data.campaign.spend)} />
              <StatPill label="Revenue" value={fmtCurrency(data.campaign.revenue)} />
              <StatPill label="ROAS"    value={data.campaign.spend > 0 ? fmtMultiplier(data.campaign.revenue / data.campaign.spend) : '—'} />
              <StatPill label="Clicks"  value={fmtNumber(data.campaign.clicks)} />
              <StatPill label="Impr."   value={fmtNumber(data.campaign.impressions)} />
              <StatPill label="CTR"     value={fmtPercent(calcCTR(data.campaign.clicks, data.campaign.impressions))} />
              <StatPill label="CPA"     value={data.campaign.conversions > 0 ? fmtCurrency(calcCPA(data.campaign.spend, data.campaign.conversions)) : '—'} />
            </div>
          </div>

          {/* Ad Sets */}
          <div>
            <h2 className="text-sm font-semibold text-zinc-300 mb-3">
              Ad Sets
              <span className="ml-2 text-xs font-medium text-zinc-600">({data.adsets?.length ?? 0})</span>
            </h2>
            {!data.adsets || data.adsets.length === 0 ? (
              <EmptyState title="No ad sets" description="No ad set data for this campaign." />
            ) : (
              <div className="space-y-2">
                {data.adsets.map(({ adset, ads }) => (
                  <AdSetAccordion key={adset.adset_id} adset={adset} ads={ads ?? []} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
