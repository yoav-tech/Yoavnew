interface EmptyStateProps {
  title?: string
  description?: string
}

export function EmptyState({
  title = 'No data available',
  description = 'No data for the selected filters and date range.',
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-center gap-3">
      <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center">
        <svg className="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-medium text-zinc-400">{title}</p>
        <p className="text-xs text-zinc-600 mt-0.5 max-w-xs">{description}</p>
      </div>
    </div>
  )
}
