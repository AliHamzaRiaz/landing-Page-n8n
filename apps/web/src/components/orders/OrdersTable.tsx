import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/orders/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency } from '@/lib/utils'
import type { Order } from '@/types'

export function OrdersTable({
  orders,
  loading,
  onOpen,
  page,
  totalPages,
  onPageChange,
}: {
  orders: Order[]
  loading?: boolean
  onOpen: (order: Order) => void
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-12" />
        ))}
      </div>
    )
  }

  if (!orders.length) {
    return (
      <EmptyState
        title="No orders found"
        description="Try adjusting filters, or wait for new WhatsApp orders to arrive."
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Order</th>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Total</th>
              <th className="px-4 py-3 font-semibold">Created</th>
              <th className="px-4 py-3 font-semibold"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50/70">
                <td className="px-4 py-3 font-medium text-ink">
                  <Link to={`/orders/${order.id}`} className="hover:text-brand focus-ring rounded">
                    #{order.id.slice(0, 8)}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {order.customer?.name ?? 'Unknown'}
                  <div className="text-xs text-muted">{order.customer?.phone}</div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-4 py-3 font-medium">
                  {formatCurrency(order.totalAmount, order.currency ?? 'USD')}
                </td>
                <td className="px-4 py-3 text-muted">
                  {format(new Date(order.createdAt), 'MMM d, yyyy HH:mm')}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="outline" size="sm" onClick={() => onOpen(order)}>
                    Details
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-border px-4 py-3">
        <p className="text-xs text-muted">
          Page {page} of {Math.max(totalPages, 1)}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
