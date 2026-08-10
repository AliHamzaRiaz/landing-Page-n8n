import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency, formatNumber } from '@/lib/utils'
import type { Customer } from '@/types'

export function CustomersTable({
  customers,
  loading,
}: {
  customers: Customer[]
  loading?: boolean
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

  if (!customers.length) {
    return (
      <EmptyState
        title="No customers yet"
        description="Customers appear automatically when WhatsApp orders are received."
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Phone</th>
              <th className="px-4 py-3 font-semibold">Orders</th>
              <th className="px-4 py-3 font-semibold">Total spent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-slate-50/70">
                <td className="px-4 py-3">
                  <Link to={`/customers/${customer.id}`} className="font-medium text-ink hover:text-brand focus-ring rounded">
                    {customer.name}
                  </Link>
                  {customer.email ? <p className="text-xs text-muted">{customer.email}</p> : null}
                </td>
                <td className="px-4 py-3 text-slate-700">{customer.phone}</td>
                <td className="px-4 py-3">{formatNumber(customer.orderCount ?? customer.orders?.length ?? 0)}</td>
                <td className="px-4 py-3 font-medium">{formatCurrency(customer.totalSpent ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
