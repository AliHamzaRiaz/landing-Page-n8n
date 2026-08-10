import { formatNumber } from '@/lib/utils'
import type { DashboardStats } from '@/types'

const items: Array<{
  key: keyof Pick<DashboardStats, 'newOrders' | 'pending' | 'dispatched' | 'delivered'>
  label: string
}> = [
  { key: 'newOrders', label: 'New Orders' },
  { key: 'pending', label: 'Pending' },
  { key: 'dispatched', label: 'Dispatched' },
  { key: 'delivered', label: 'Delivered' },
]

export function StatsCards({ stats, loading }: { stats?: DashboardStats; loading?: boolean }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.key} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-sm font-medium text-muted">{item.label}</p>
          <p className="mt-2 text-3xl font-semibold text-ink">
            {loading || !stats ? '—' : formatNumber(stats[item.key] ?? 0)}
          </p>
        </div>
      ))}
    </div>
  )
}
