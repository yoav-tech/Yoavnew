import { NavLink } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

const PLATFORM_LINKS = [
  { to: '/dashboard/platform/meta', label: 'Meta Ads', dot: 'bg-blue-500' },
  { to: '/dashboard/platform/google', label: 'Google Ads', dot: 'bg-red-500' },
  { to: '/dashboard/platform/tiktok', label: 'TikTok Ads', dot: 'bg-pink-500' },
  { to: '/dashboard/platform/linkedin', label: 'LinkedIn Ads', dot: 'bg-sky-500' },
]

interface SidebarProps {
  mobile?: boolean
  onClose?: () => void
}

export function Sidebar({ mobile = false, onClose }: SidebarProps) {
  const { profile, signOut } = useAuth()
  const isAdmin = profile?.role === 'admin'

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-indigo-600 text-white'
        : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
    }`

  return (
    <aside
      className={`${mobile ? 'w-full' : 'w-60 min-h-screen'} bg-gray-950 border-r border-gray-800 flex flex-col`}
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            L
          </div>
          <div>
            <div className="text-sm font-bold text-gray-100">LEADERS</div>
            <div className="text-xs text-gray-500">Ads Hub</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
        <NavLink to="/dashboard" end className={linkClass} onClick={onClose}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Overview
        </NavLink>

        <div className="mt-3 mb-1 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
          Platforms
        </div>

        {PLATFORM_LINKS.map((link) => (
          <NavLink key={link.to} to={link.to} className={linkClass} onClick={onClose}>
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${link.dot}`} />
            {link.label}
          </NavLink>
        ))}

        <div className="mt-3 mb-1 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
          Analysis
        </div>

        <NavLink to="/dashboard/funnel" className={linkClass} onClick={onClose}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          Funnel
        </NavLink>

        {isAdmin && (
          <>
            <div className="mt-3 mb-1 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Admin
            </div>
            <NavLink to="/settings" className={linkClass} onClick={onClose}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </NavLink>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-800">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-indigo-800 flex items-center justify-center text-xs font-bold text-indigo-200">
            {(profile?.display_name ?? 'U')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-gray-300 truncate">
              {profile?.display_name ?? 'User'}
            </div>
            <div className="text-xs text-gray-600 capitalize">{profile?.role}</div>
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full text-left text-xs text-gray-500 hover:text-gray-300 transition-colors py-1"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
