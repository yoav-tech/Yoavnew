interface EmptyStateProps {
  title?: string
  description?: string
}

export function EmptyState({
  title = 'No data available',
  description = 'There is no data for the selected filters and date range.',
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-center gap-2">
      <div className="text-3xl">📊</div>
      <p className="text-gray-300 font-medium">{title}</p>
      <p className="text-gray-500 text-sm max-w-xs">{description}</p>
    </div>
  )
}
