import { useEffect } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'

export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40"
        aria-label="Close navigation"
        onClick={onClose}
      />
      <div className="relative h-full w-72 max-w-[85vw] animate-slide-in shadow-xl">
        <Sidebar onNavigate={onClose} />
      </div>
    </div>
  )
}
