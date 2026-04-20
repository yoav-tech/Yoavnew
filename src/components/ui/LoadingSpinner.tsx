export function SkeletonLine({ className = '' }: { className?: string }) {
  return <div className={`bg-zinc-800 rounded animate-pulse ${className}`} />
}

export function PageLoader() {
  return (
    <div className="flex flex-col gap-3 w-full py-8 px-4">
      <SkeletonLine className="h-4 w-3/4" />
      <SkeletonLine className="h-4 w-1/2" />
      <SkeletonLine className="h-4 w-5/6" />
      <SkeletonLine className="h-4 w-2/3" />
    </div>
  )
}

export function LoadingSpinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="w-5 h-5 border-2 border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
    </div>
  )
}
