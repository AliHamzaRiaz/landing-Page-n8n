import { useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { MobileNav } from '@/components/layout/MobileNav'

function pageFromPath(pathname: string) {
  if (pathname.startsWith('/orders')) return 'orders'
  if (pathname.startsWith('/settings')) return 'settings'
  if (pathname.startsWith('/dashboard')) return 'dashboard'
  return 'dashboard'
}

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()
  const page = pageFromPath(pathname)

  return (
    <div className="app-shell flex min-h-screen" data-page={page}>
      <div className="hidden lg:block">
        <div className="sticky top-0 h-screen">
          <Sidebar />
        </div>
      </div>
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header title={title} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  )
}
