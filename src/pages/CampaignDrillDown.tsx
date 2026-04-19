import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useFilters } from '@/contexts/FiltersContext'
import { useCampaignHierarchy } from '@/hooks/useCampaigns'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { fmtCurrency, fmtNumber, fmtMultiplier, fmtPercent, calcCTR, calcCPA } from '@/lib/utils'
import type { AdSetRow, AdRow } from '@/types/database'

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs py-0.5">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-300 font-medium">{value}</span>
    </div>
  )
}

function AdSetAccordion({ adset, ads }: { adset: AdSetRow; ads: AdRow[] }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-gray-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-800/50 hover:bg-gray-800 transition-colors text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <svg
            className={`w-3.5 h-3.5 text-gray-500 flex-shrink-0 transition-transform ${open ? 'rotate-90' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-sm font-medium text-gray-200 truncate">
            {adset.adset_name || adset.adset_id}
          </span>
        </div>
        <div className="flex items-center gap-6 text-xs text-gray-400 flex-shrink-0 ml-4">
          <span>{fmtCurrency(adset.spend)}</span>
          <span className="hidden sm:block">ROAS {adset.spend > 0 ? fmtMultiplier(adset.revenue / adset.spend) : '—'}</span>
          <span>{fmtNumber(adset.conversions)} conv.</span>
        </div>
      </button>

      {open && (
        <div className="divide-y divide-gray-800/50">
          {ads.length === 0 ? (
            <p className="px-6 py-3 text-xs text-gray-500">No ad-level data</p>
          ) : (
            ads.map((ad) => (
              <div key={ad.ad_id} className="px-6 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="col-span-2 sm:col-span-4">
                  <p className="text-xs font-medium text-gray-300 truncate">{ad.ad_name || ad.ad_id}</p>
                </div>
                <MetricRow label="Spend" value={fmtCurrency(ad.spend)} />
                <MetricRow label="Revenue" value={fmtCurrency(ad.revenue)} />
                <MetricRow label="ROAS" value={ad.spend > 0 ? fmtMultiplier(ad.revenue / ad.spend) : '—'} />
                <MetricRow label="Clicks" value={fmtNumber(ad.clicks)} />
                <MetricRow label="CTR" value={fmtPercent(calcCTR(ad.clicks, ad.impressions))} />
                <MetricRow label="Conv." value={fmtNumber(ad.conversions)} />
                <MetricRow label="CPA" value={ad.conversions > 0 ? fmtCurrency(calcCPA(ad.spend, ad.conversions)) : '—'} />
                <MetricRow label="Leads" value={fmtNumber(ad.leads)} />
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
    <div className="p-4 lg:p-6 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-100 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {isLoading ? (
        <PageLoader />
      ) : !data?.campaign ? (
        <EmptyState title="Campaign not found" description="No data found for this campaign in the selected date range." />
      ) : (
        <>
          {/* Campaign summary */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-lg font-bold text-gray-100">
                  {data.campaign.campaign_name || data.campaign.campaign_id}
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  {data.campaign.account_name} · <span className="capitalize">{data.campaign.platform}</span>
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
              {[
                { label: 'Spend',   value: fmtCurrency(data.campaign.spend) },
                { label: 'Revenue', value: fmtCurrency(data.campaign.revenue) },
                { label: 'ROAS',    value: data.campaign.spend > 0 ? fmtMultiplier(data.campaign.revenue / data.campaign.spend) : '—' },
                { label: 'Clicks',  value: fmtNumber(data.campaign.clicks) },
                { label: 'Impr.',   value: fmtNumber(data.campaign.impressions) },
                { label: 'CTR',     value: fmtPercent(calcCTR(data.campaign.clicks, data.campaign.impressions)) },
                { label: 'CPA',     value: data.campaign.conversions > 0 ? fmtCurrency(calcCPA(data.campaign.spend, data.campaign.conversions)) : '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="text-xs text-gray-500 mb-1">{label}</div>
                  <div className="text-sm font-semibold text-gray-100">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Ad Sets */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-300">
              Ad Sets ({data.adsets?.length ?? 0})
            </h2>
            {!data.adsets || data.adsets.length === 0 ? (
              <EmptyState title="No ad sets" description="No ad set data for this campaign." />
            ) : (
              data.adsets.map(({ adset, ads }) => (
                <AdSetAccordion key={adset.adset_id} adset={adset} ads={ads ?? []} />
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
