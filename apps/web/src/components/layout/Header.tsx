import { Menu } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { NotificationDropdown } from '@/components/layout/NotificationDropdown'

export function Header({
  title,
  onMenuClick,
}: {
  title: string
  onMenuClick: () => void
}) {
  const { user } = useAuth()
  const initial = (user?.name || user?.phoneNumber || 'U').slice(0, 1).toUpperCase()

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-white/60 bg-white/75 px-4 py-3 backdrop-blur-xl md:px-8">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="px-2 lg:hidden"
          aria-label="Open navigation"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--brand)]">
            Workspace
          </p>
          <h1 className="text-lg font-bold text-ink md:text-xl">{title}</h1>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <NotificationDropdown />
        <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-2 py-1.5 shadow-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[linear-gradient(135deg,var(--brand),var(--accent))] text-xs font-bold text-white">
            {initial}
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-ink">{user?.name || 'Owner'}</p>
            <p className="text-xs text-muted">{user?.phoneNumber || user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
