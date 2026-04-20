import { NavLink } from 'react-router-dom'

interface NavItemDef {
  to: string
  label: string
  end: boolean
  color: string | null
}

interface MobileNavProps {
  open: boolean
  onClose: () => void
  navItems: NavItemDef[]
  isAdmin: boolean
}

export function MobileNav({ open, onClose, navItems, isAdmin }: MobileNavProps) {
  if (!open) return null
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed top-0 left-0 bottom-0 z-50 w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col">
        <div className="flex items-center justify-between px-4 border-b border-zinc-800" style={{ height: '52px' }}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-violet-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs font-display">L</span>
            </div>
            <span className="text-sm font-semibold text-zinc-200 font-display">LEADERS</span>
          </div>
          <button onClick={onClose} className="p-1.5 text-zinc-500 hover:text-zinc-200 transition-colors rounded-lg hover:bg-zinc-800">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'text-zinc-100 bg-zinc-800'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {item.color && (
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: isActive ? item.color : '#52525B' }}
                    />
                  )}
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink
              to="/settings"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'text-zinc-100 bg-zinc-800'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`
              }
            >
              Settings
            </NavLink>
          )}
        </nav>
      </div>
    </>
  )
}
