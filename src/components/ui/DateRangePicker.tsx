import { useState } from 'react'
import { format } from 'date-fns'
import { useFilters, type DatePreset } from '@/contexts/FiltersContext'
import { getPresetRange } from '@/lib/utils'

const PRESETS: { label: string; value: DatePreset }[] = [
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
  { label: '120D', value: '120d' },
  { label: 'Custom', value: 'custom' },
]

export function DateRangePicker() {
  const { dateRange, setDateRange } = useFilters()
  const [showCustom, setShowCustom] = useState(false)
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
  }

  function applyCustom() {
    if (!customFrom || !customTo) return
    setDateRange({
      from: new Date(customFrom + 'T00:00:00'),
      to: new Date(customTo + 'T00:00:00'),
      preset: 'custom',
    })
    setShowCustom(false)
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex rounded-lg overflow-hidden border border-gray-700">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => handlePreset(p.value)}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              dateRange.preset === p.value
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-900 text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {(showCustom || dateRange.preset === 'custom') && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
          />
          <span className="text-gray-500 text-xs">→</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={applyCustom}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg font-medium transition-colors"
          >
            Apply
          </button>
        </div>
      )}

      {dateRange.preset !== 'custom' && (
        <span className="text-xs text-gray-500">
          {format(dateRange.from, 'MMM d')} – {format(dateRange.to, 'MMM d, yyyy')}
        </span>
      )}
    </div>
  )
}
