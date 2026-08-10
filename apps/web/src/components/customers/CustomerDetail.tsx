import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { StatusBadge } from '@/components/orders/StatusBadge'
import { formatCurrency } from '@/lib/utils'
import type { Customer } from '@/types'

export function CustomerDetail({ customer }: { customer: Customer }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{customer.name}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Phone</p>
            <p className="mt-1 text-sm font-medium">{customer.phone}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Email</p>
            <p className="mt-1 text-sm font-medium">{customer.email || '—'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Orders</p>
            <p className="mt-1 text-sm font-medium">{customer.orderCount ?? customer.orders?.length ?? 0}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Total spent</p>
            <p className="mt-1 text-sm font-medium">{formatCurrency(customer.totalSpent ?? 0)}</p>
          </div>
          {customer.notes ? (
            <div className="sm:col-span-2">
              <p className="text-xs uppercase tracking-wide text-muted">Notes</p>
              <p className="mt-1 text-sm text-slate-700">{customer.notes}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order history</CardTitle>
        </CardHeader>
        <CardContent>
          {!customer.orders?.length ? (
            <p className="text-sm text-muted">No orders for this customer yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {customer.orders.map((order) => (
                <li key={order.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <Link to={`/orders/${order.id}`} className="text-sm font-medium hover:text-brand focus-ring rounded">
                      #{order.id.slice(0, 8)}
                    </Link>
                    <p className="text-xs text-muted">
                      {format(new Date(order.createdAt), 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.status} />
                    <span className="text-sm font-semibold">
                      {formatCurrency(order.totalAmount, order.currency ?? 'USD')}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
