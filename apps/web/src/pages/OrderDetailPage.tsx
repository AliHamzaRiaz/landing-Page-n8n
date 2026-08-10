import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Link, useParams } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { StatusBadge } from '@/components/orders/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { Label } from '@/components/ui/Label'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { apiGet, apiPatch, getFriendlyErrorMessage } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import type { Order, OrderStatus } from '@/types'

const statuses: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
]

export function OrderDetailPage() {
  const { id = '' } = useParams()
  const queryClient = useQueryClient()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['orders', id],
    queryFn: () => apiGet<Order>(`/orders/${id}`),
    enabled: Boolean(id),
  })

  const updateStatus = useMutation({
    mutationFn: (status: OrderStatus) => apiPatch<Order>(`/orders/${id}`, { status }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  return (
    <AppShell title="Order details">
      <div className="mb-4">
        <Link to="/orders" className="text-sm font-medium text-brand hover:underline">
          ← Back to orders
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <ErrorState description={getFriendlyErrorMessage(error)} onRetry={() => void refetch()} />
      ) : !data ? (
        <ErrorState title="Order not found" description="This order may have been removed." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Order #{data.id.slice(0, 8)}</CardTitle>
                <p className="mt-1 text-sm text-muted">
                  {format(new Date(data.createdAt), 'MMM d, yyyy HH:mm')}
                </p>
              </div>
              <StatusBadge status={data.status} />
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="text-sm font-semibold">Items</p>
                <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
                  {(data.items ?? []).map((item) => (
                    <li key={item.id} className="flex justify-between gap-3 px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted">
                          {item.quantity} × {formatCurrency(item.unitPrice, data.currency ?? 'USD')}
                        </p>
                      </div>
                      <p className="font-medium">
                        {formatCurrency(item.totalPrice, data.currency ?? 'USD')}
                      </p>
                    </li>
                  ))}
                  {!data.items?.length ? (
                    <li className="px-3 py-4 text-sm text-muted">No line items available.</li>
                  ) : null}
                </ul>
              </div>
              {data.notes ? (
                <div>
                  <p className="text-sm font-semibold">Notes</p>
                  <p className="mt-1 text-sm text-muted">{data.notes}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Total</span>
                  <span className="font-semibold">
                    {formatCurrency(data.totalAmount, data.currency ?? 'USD')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Customer</span>
                  <span className="font-medium">{data.customer?.name ?? 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Phone</span>
                  <span>{data.customer?.phone ?? '—'}</span>
                </div>
                {data.customer?.id ? (
                  <Link to={`/customers/${data.customer.id}`}>
                    <Button variant="outline" size="sm" className="mt-2 w-full">
                      View customer
                    </Button>
                  </Link>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Update status</CardTitle>
              </CardHeader>
              <CardContent>
                <Label htmlFor="order-status">Status</Label>
                <Select
                  id="order-status"
                  value={data.status}
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
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </AppShell>
  )
}
