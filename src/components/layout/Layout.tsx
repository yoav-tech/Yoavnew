import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { DateRangePicker } from '@/components/ui/DateRangePicker'
import { PlatformFilter } from '@/components/ui/PlatformFilter'
import { ClientFilter } from '@/components/ui/ClientFilter'
import { useAuth } from '@/contexts/AuthContext'
import { useTriggerSync } from '@/hooks/useSyncStatus'

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const { mutate: triggerSync, isPending: syncing } = useTriggerSync()

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-50 w-60 h-full">
            <Sidebar mobile onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 bg-gray-950 border-b border-gray-800 px-4 lg:px-6 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Filters */}
            <DateRangePicker />

            <div className="h-4 w-px bg-gray-700 hidden sm:block" />

            {isAdmin && <ClientFilter />}

            <PlatformFilter />

            {/* Refresh button (admin) */}
            {isAdmin && (
              <button
                onClick={() => triggerSync()}
                disabled={syncing}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 border border-gray-700 rounded-lg text-xs font-medium text-gray-300 transition-colors"
              >
                <svg
                  className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {syncing ? 'Syncing…' : 'Refresh'}
              </button>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
