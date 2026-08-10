import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ShoppingBag, Settings, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, active: 'bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-400/30' },
  { to: '/orders', label: 'Orders', icon: ShoppingBag, active: 'bg-sky-500/20 text-sky-200 ring-1 ring-sky-400/30' },
  { to: '/settings', label: 'Settings', icon: Settings, active: 'bg-violet-500/20 text-violet-200 ring-1 ring-violet-400/30' },
]

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { business, logout } = useAuth()

  return (
    <aside
      className="flex h-full w-64 flex-col text-slate-300"
      style={{
        background:
          'linear-gradient(180deg, #0b1220 0%, #111827 55%, #0f172a 100%)',
        borderRight: '1px solid var(--app-sidebar-border)',
      }}
    >
      <div className="border-b border-white/10 px-5 py-5">
        <p
          className="font-display text-2xl font-bold tracking-tight"
          style={{
            backgroundImage: 'linear-gradient(120deg, #a5b4fc, #67e8f9 55%, #fcd34d)',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
          }}
        >
          Ennitant
        </p>
        <p className="mt-1 truncate text-xs text-slate-400">
          {business?.companyName || business?.name || 'Your business'}
        </p>
      </div>
      <nav className="flex-1 space-y-1.5 p-3" aria-label="Main">
        {links.map(({ to, label, icon: Icon, active }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition focus-ring',
                isActive ? active : 'text-slate-400 hover:bg-white/5 hover:text-white',
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={() => void logout()}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white focus-ring"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Sign out
        </button>
      </div>
    </aside>
  )
}
