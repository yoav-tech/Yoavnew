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

  let deltaColor = 'text-gray-500'
  let deltaIcon = ''

  if (isPositive) {
    deltaColor = lowerIsBetter ? 'text-red-400' : 'text-green-400'
    deltaIcon = '▲'
  } else if (isNegative) {
    deltaColor = lowerIsBetter ? 'text-green-400' : 'text-red-400'
    deltaIcon = '▼'
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-1 hover:border-gray-700 transition-colors">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</span>
      {loading ? (
        <div className="h-8 w-24 bg-gray-800 rounded animate-pulse mt-1" />
      ) : (
        <span className="text-2xl font-bold text-gray-100 tracking-tight">{value}</span>
      )}
      {delta !== undefined && !loading && (
        <span className={`text-xs font-medium ${deltaColor}`}>
          {deltaIcon} {Math.abs(delta).toFixed(1)}% vs prior period
        </span>
      )}
    </div>
  )
}
