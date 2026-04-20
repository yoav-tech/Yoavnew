interface KPICardProps {
  label: string
  value: string
  delta?: number
  lowerIsBetter?: boolean
  loading?: boolean
}

export function KPICard({ label, value, delta, lowerIsBetter = false, loading = false }: KPICardProps) {
  const isPositive = delta !== undefined && delta > 0
  const isNegative = delta !== undefined && delta < 0

  let deltaColor = 'text-zinc-500'
  let deltaIcon = null

  if (isPositive) {
    deltaColor = lowerIsBetter ? 'text-red-400' : 'text-emerald-400'
    deltaIcon = (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
      </svg>
    )
  } else if (isNegative) {
    deltaColor = lowerIsBetter ? 'text-emerald-400' : 'text-red-400'
    deltaIcon = (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
      </svg>
    )
  }

  return (
    <div className="group relative bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-zinc-700 transition-all duration-200 overflow-hidden cursor-default">
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: 'radial-gradient(circle at top left, rgba(124,58,237,0.07), transparent 65%)' }} />
      <div className="relative">
        <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-2.5">{label}</p>
        {loading ? (
          <div className="space-y-1.5">
            <div className="h-7 w-24 bg-zinc-800 rounded-lg animate-pulse" />
            <div className="h-3.5 w-16 bg-zinc-800/60 rounded animate-pulse" />
          </div>
        ) : (
          <>
            <p className="text-[1.625rem] font-bold text-zinc-100 font-display tabular leading-none tracking-tight">
              {value}
            </p>
            {delta !== undefined ? (
              <div className={`flex items-center gap-1 mt-2 ${deltaColor}`}>
                {deltaIcon}
                <span className="text-xs font-semibold">{Math.abs(delta).toFixed(1)}%</span>
                <span className="text-[11px] text-zinc-600">vs prior</span>
              </div>
            ) : (
              <div className="mt-2 h-4" />
            )}
          </>
        )}
      </div>
    </div>
  )
}
