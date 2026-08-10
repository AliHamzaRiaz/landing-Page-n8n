import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { apiGet, apiPatch, getFriendlyErrorMessage } from '@/lib/api'
import type { Notification } from '@/types'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/utils'

export function NotificationDropdown() {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiGet<Notification[]>('/notifications'),
    refetchInterval: 60_000,
  })

  const markRead = useMutation({
    mutationFn: (id: string) => apiPatch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAll = useMutation({
    mutationFn: () => apiPatch('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const notifications = data ?? []
  const unread = notifications.filter((n) => !n.isRead).length

  return (
    <div className="relative" ref={rootRef}>
      <Button
        variant="ghost"
        size="sm"
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
        className="relative px-2"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 ? (
          <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div
          className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-surface shadow-xl animate-slide-in"
          role="menu"
          aria-label="Notifications"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            <button
              type="button"
              className="text-xs font-medium text-brand hover:underline focus-ring rounded"
              onClick={() => markAll.mutate()}
              disabled={markAll.isPending || unread === 0}
            >
              Mark all read
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : error ? (
              <p className="px-4 py-6 text-sm text-danger">{getFriendlyErrorMessage(error)}</p>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted">You’re all caught up.</p>
            ) : (
              <ul className="divide-y divide-border">
                {notifications.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={cn(
                        'w-full px-4 py-3 text-left transition hover:bg-slate-50 focus-ring',
                        !item.isRead && 'bg-teal-50/40',
                      )}
                      onClick={() => {
                        if (!item.isRead) markRead.mutate(item.id)
                      }}
                    >
                      <p className="text-sm font-medium text-ink">{item.title}</p>
                      <p className="mt-0.5 text-xs text-muted line-clamp-2">{item.message}</p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
