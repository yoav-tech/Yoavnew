import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { useAuth } from '@/contexts/AuthContext'
import { useFilters } from '@/contexts/FiltersContext'
import { useTriggerSync } from '@/hooks/useSyncStatus'
import { useClients } from '@/hooks/useClients'
import { DateRangePicker } from '@/components/ui/DateRangePicker'
import { MobileNav } from './Sidebar'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Overview', end: true, color: null },
  { to: '/dashboard/platform/meta',     label: 'Meta',     end: false, color: '#1877F2' },
  { to: '/dashboard/platform/google',   label: 'Google',   end: false, color: '#EA4335' },
  { to: '/dashboard/platform/tiktok',   label: 'TikTok',   end: false, color: '#FE2C55' },
  { to: '/dashboard/platform/linkedin', label: 'LinkedIn', end: false, color: '#0A66C2' },
  { to: '/dashboard/funnel',            label: 'Funnel',   end: false, color: null },
]

function NavItem({ to, label, end = false, color }: { to: string; label: string; end?: boolean; color: string | null }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 whitespace-nowrap ${
          isActive
            ? 'text-zinc-100 bg-zinc-800'
            : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {color && (
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: isActive ? color : '#52525B' }}
            />
          )}
          {label}
        </>
      )}
    </NavLink>
  )
}

function RefreshBtn() {
  const { mutate: triggerSync, isPending } = useTriggerSync()
  return (
    <button
      onClick={() => triggerSync()}
      disabled={isPending}
      title="Manual sync"
      className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800/60 hover:bg-zinc-700/80 border border-zinc-700/60 text-zinc-400 hover:text-zinc-200 transition-all disabled:opacity-40"
    >
      <svg className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    </button>
  )
}

function DateBadge() {
  const { dateRange } = useFilters()
  const [open, setOpen] = useState(false)

  const label =
    dateRange.preset !== 'custom'
      ? dateRange.preset.toUpperCase()
      : `${format(dateRange.from, 'MMM d')} – ${format(dateRange.to, 'MMM d')}`

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-zinc-800/60 hover:bg-zinc-700/80 border border-zinc-700/60 text-xs font-medium text-zinc-300 hover:text-zinc-100 transition-all"
      >
        <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {label}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-2xl min-w-[340px]">
            <DateRangePicker onClose={() => setOpen(false)} />
          </div>
        </>
      )}
    </div>
  )
}

function ClientBadge() {
  const { clientId, setClientId } = useFilters()
  const { data: clients = [] } = useClients()
  if (!clients.length) return null
  const selected = clients.find((c) => c.id === clientId)

  return (
    <select
      value={clientId ?? ''}
      onChange={(e) => setClientId(e.target.value || null)}
      className="h-8 pl-3 pr-7 rounded-lg bg-zinc-800/60 hover:bg-zinc-700/80 border border-zinc-700/60 text-xs font-medium text-zinc-300 focus:outline-none cursor-pointer appearance-none"
      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371717A' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
    >
      <option value="">{selected ? selected.name : 'All clients'}</option>
      {clients.map((c) => (
        <option key={c.id} value={c.id}>{c.name}</option>
      ))}
    </select>
  )
}

function UserMenu() {
  const { profile, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-full bg-violet-700 flex items-center justify-center text-xs font-semibold text-white hover:bg-violet-600 transition-colors"
      >
        {(profile?.display_name ?? 'U')[0].toUpperCase()}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 w-48 bg-zinc-900 border border-zinc-800 rounded-xl py-1.5 shadow-2xl">
            <div className="px-3 py-2 border-b border-zinc-800 mb-1">
              <p className="text-xs font-medium text-zinc-200 truncate">{profile?.display_name ?? 'User'}</p>
              <p className="text-xs text-zinc-600 capitalize">{profile?.role}</p>
            </div>
            {profile?.role === 'admin' && (
              <button
                onClick={() => { setOpen(false); navigate('/settings') }}
                className="w-full text-left px-3 py-2 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              >
                Settings
              </button>
            )}
            <button
              onClick={signOut}
              className="w-full text-left px-3 py-2 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'

  return (
    <div className="min-h-screen bg-canvas">
      {/* Top navigation bar */}
      <header className="fixed top-0 left-0 right-0 z-30 h-13 border-b border-zinc-800/80 bg-canvas/90 backdrop-blur-xl"
        style={{ height: '52px' }}>
        <div className="flex items-center h-full px-4 gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0 mr-2">
            <div className="w-6 h-6 rounded-md bg-violet-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs font-display">L</span>
            </div>
            <span className="text-sm font-semibold text-zinc-200 font-display hidden sm:block tracking-tight">
              LEADERS
            </span>
          </div>

          <div className="w-px h-4 bg-zinc-800 flex-shrink-0 hidden sm:block" />

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1 overflow-x-auto scrollbar-hide">
            {NAV_ITEMS.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
            {isAdmin && <NavItem to="/settings" label="Settings" color={null} />}
          </nav>

          {/* Right side controls */}
          <div className="flex items-center gap-2 ml-auto flex-shrink-0">
            {isAdmin && <ClientBadge />}
            <DateBadge />
            {isAdmin && <RefreshBtn />}
            <UserMenu />
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            onClick={() => setMobileOpen(true)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile nav drawer */}
      <MobileNav
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        navItems={NAV_ITEMS}
        isAdmin={isAdmin}
      />

      {/* Page content */}
      <main style={{ paddingTop: '52px' }} className="min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
