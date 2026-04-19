import { createContext, useContext, useState, ReactNode } from 'react'
import { subDays, startOfDay } from 'date-fns'
import type { Platform } from '@/types/database'

export type DatePreset = '7d' | '30d' | '90d' | '120d' | 'custom'

export interface DateRange {
  from: Date
  to: Date
  preset: DatePreset
}

interface FiltersContextValue {
  dateRange: DateRange
  clientId: string | null
  platforms: Platform[]
  setDateRange: (range: DateRange) => void
  setClientId: (id: string | null) => void
  setPlatforms: (platforms: Platform[]) => void
}

const defaultRange: DateRange = {
  from: subDays(startOfDay(new Date()), 29),
  to: startOfDay(new Date()),
  preset: '30d',
}

const FiltersContext = createContext<FiltersContextValue | null>(null)

export function FiltersProvider({ children }: { children: ReactNode }) {
  const [dateRange, setDateRange] = useState<DateRange>(defaultRange)
  const [clientId, setClientId] = useState<string | null>(null)
  const [platforms, setPlatforms] = useState<Platform[]>([])

  return (
    <FiltersContext.Provider value={{ dateRange, clientId, platforms, setDateRange, setClientId, setPlatforms }}>
      {children}
    </FiltersContext.Provider>
  )
}

export function useFilters() {
  const ctx = useContext(FiltersContext)
  if (!ctx) throw new Error('useFilters must be used within FiltersProvider')
  return ctx
}
