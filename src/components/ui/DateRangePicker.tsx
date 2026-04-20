import { useState } from 'react'
import { format } from 'date-fns'
import { useFilters, type DatePreset } from '@/contexts/FiltersContext'
import { getPresetRange } from '@/lib/utils'

const PRESETS: { label: string; value: DatePreset }[] = [
  { label: '7D',     value: '7d' },
  { label: '30D',    value: '30d' },
  { label: '90D',    value: '90d' },
  { label: '120D',   value: '120d' },
  { label: 'Custom', value: 'custom' },
]

interface DateRangePickerProps {
  onClose?: () => void
}

export function DateRangePicker({ onClose }: DateRangePickerProps) {
  const { dateRange, setDateRange } = useFilters()
  const [showCustom, setShowCustom] = useState(dateRange.preset === 'custom')
  const [customFrom, setCustomFrom] = useState(format(dateRange.from, 'yyyy-MM-dd'))
  const [customTo, setCustomTo] = useState(format(dateRange.to, 'yyyy-MM-dd'))

  function handlePreset(preset: DatePreset) {
    if (preset === 'custom') {
      setShowCustom(true)
      return
    }
    setShowCustom(false)
    const { from, to } = getPresetRange(preset)
    setDateRange({ from, to, preset })
    onClose?.()
  }

  function applyCustom() {
    if (!customFrom || !customTo) return
    setDateRange({
      from: new Date(customFrom + 'T00:00:00'),
      to: new Date(customTo + 'T00:00:00'),
      preset: 'custom',
    })
    onClose?.()
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-2.5">Range</p>
        <div className="flex gap-1.5 flex-wrap">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => handlePreset(p.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                dateRange.preset === p.value
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {showCustom && (
        <div>
          <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-2.5">Custom dates</p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <label className="text-xs text-zinc-500 w-8">From</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-zinc-500 w-8">To</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
            <button
              onClick={applyCustom}
              className="w-full mt-1 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Apply range
            </button>
          </div>
        </div>
      )}

      {dateRange.preset !== 'custom' && (
        <div className="border-t border-zinc-800 pt-3">
          <p className="text-[11px] text-zinc-600">
            {format(dateRange.from, 'MMM d, yyyy')} – {format(dateRange.to, 'MMM d, yyyy')}
          </p>
        </div>
      )}
    </div>
  )
}
