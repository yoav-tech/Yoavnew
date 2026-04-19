import { useFilters } from '@/contexts/FiltersContext'
import type { Platform } from '@/types/database'

const PLATFORMS: { value: Platform; label: string; color: string }[] = [
  { value: 'meta', label: 'Meta', color: 'text-blue-400 border-blue-800 bg-blue-950' },
  { value: 'google', label: 'Google', color: 'text-red-400 border-red-800 bg-red-950' },
  { value: 'tiktok', label: 'TikTok', color: 'text-pink-400 border-pink-800 bg-pink-950' },
  { value: 'linkedin', label: 'LinkedIn', color: 'text-sky-400 border-sky-800 bg-sky-950' },
]

export function PlatformFilter() {
  const { platforms, setPlatforms } = useFilters()

  function toggle(platform: Platform) {
    if (platforms.includes(platform)) {
      setPlatforms(platforms.filter((p) => p !== platform))
    } else {
      setPlatforms([...platforms, platform])
    }
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {PLATFORMS.map((p) => {
        const active = platforms.includes(p.value)
        return (
          <button
            key={p.value}
            onClick={() => toggle(p.value)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
              active
                ? p.color
                : 'text-gray-500 border-gray-700 bg-transparent hover:border-gray-600 hover:text-gray-300'
            }`}
          >
            {p.label}
          </button>
        )
      })}
    </div>
  )
}
