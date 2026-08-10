import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { format } from 'date-fns'
import { useEffect } from 'react'
import { apiPatch, getFriendlyErrorMessage } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import type { Order, OrderStatus } from '@/types'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Label'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/orders/StatusBadge'
import { Link } from 'react-router-dom'

const statuses: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'DISPATCHED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
]

const timelineSteps: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'DISPATCHED',
  'DELIVERED',
]

export function OrderDetailsDrawer({
  order,
  open,
  onClose,
}: {
  order: Order | null
  open: boolean
  onClose: () => void
}) {
  const queryClient = useQueryClient()

  const updateStatus = useMutation({
    mutationFn: (status: OrderStatus) => apiPatch<Order>(`/orders/${order!.id}`, { status }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      if (order) void queryClient.invalidateQueries({ queryKey: ['orders', order.id] })
    },
  })

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !order) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="presentation">
      <button type="button" className="absolute inset-0 bg-slate-900/30" aria-label="Close drawer" onClick={onClose} />
      <aside
        className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-border bg-surface shadow-xl animate-slide-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-drawer-title"
      >
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <h2 id="order-drawer-title" className="text-lg font-semibold">
              Order #{order.orderNumber || order.id.slice(0, 8)}
            </h2>
            <p className="mt-1 text-xs text-muted">
              {format(new Date(order.createdAt), 'MMM d, yyyy HH:mm')}
            </p>
          </div>
          <Button variant="ghost" size="sm" aria-label="Close" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <StatusBadge status={order.status} />
            <p className="text-lg font-semibold">
              {formatCurrency(order.totalAmount, order.currency ?? 'USD')}
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-ink">Customer</p>
            <p className="mt-1 text-sm">{order.customer?.name ?? 'Unknown'}</p>
            <p className="text-sm text-muted">{order.customer?.phone}</p>
          </div>

          <div>
            <Label htmlFor="drawer-status">Update status</Label>
            <Select
              id="drawer-status"
              value={order.status}
              disabled={updateStatus.isPending}
              onChange={(e) => updateStatus.mutate(e.target.value as OrderStatus)}
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
            {updateStatus.isError ? (
              <p className="mt-2 text-xs text-danger" role="alert">
                {getFriendlyErrorMessage(updateStatus.error)}
              </p>
            ) : null}
            {updateStatus.isSuccess ? (
              <p className="mt-2 text-xs text-success" role="status">
                Status updated.
              </p>
            ) : null}
          </div>

          <div>
            <p className="text-sm font-semibold text-ink">Items</p>
            <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
              {(order.items ?? []).map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted">
                      {item.quantity} × {formatCurrency(item.unitPrice, order.currency ?? 'USD')}
                    </p>
                  </div>
                  <p className="font-medium">{formatCurrency(item.totalPrice, order.currency ?? 'USD')}</p>
                </li>
              ))}
              {!order.items?.length ? (
                <li className="px-3 py-4 text-sm text-muted">No line items available.</li>
              ) : null}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-ink">Order timeline</p>
            <ol className="mt-3 space-y-3">
              {timelineSteps.map((step) => {
                const history = order.statusHistory?.find((h) => h.status === step)
                const reached =
                  Boolean(history) ||
                  timelineSteps.indexOf(step) <= timelineSteps.indexOf(order.status as OrderStatus)
                return (
                  <li key={step} className="flex gap-3 text-sm">
                    <span
                      className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                        reached ? 'bg-brand' : 'bg-slate-300'
                      }`}
                      aria-hidden
                    />
                    <div>
                      <p className={reached ? 'font-medium text-ink' : 'text-muted'}>{step}</p>
                      {history ? (
                        <p className="text-xs text-muted">
                          {format(new Date(history.createdAt), 'MMM d, yyyy HH:mm')}
                        </p>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>

          {order.deliveryAddress ? (
            <div>
              <p className="text-sm font-semibold text-ink">Delivery address</p>
              <p className="mt-1 text-sm text-muted">{order.deliveryAddress}</p>
            </div>
          ) : null}

          {order.notes ? (
            <div>
              <p className="text-sm font-semibold text-ink">Notes</p>
              <p className="mt-1 text-sm text-muted">{order.notes}</p>
            </div>
          ) : null}
        </div>

        <div className="border-t border-border p-4">
          <Link to={`/orders/${order.id}`}>
            <Button className="w-full" variant="outline">
              Open full details
            </Button>
          </Link>
        </div>
      </aside>
    </div>
  )
}
