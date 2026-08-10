import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { StatusBadge } from '@/components/orders/StatusBadge'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { apiGet, apiPost, getFriendlyErrorMessage } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import type { Order, VendorPortalData } from '@/types'

export function VendorPortalPage() {
  const { token = '' } = useParams()
  const queryClient = useQueryClient()
  const [successId, setSuccessId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['vendor-portal', token],
    queryFn: () => apiGet<VendorPortalData>(`/public/vendor/${token}`),
    enabled: Boolean(token),
    refetchInterval: 10000,
  })

  const dispatchMutation = useMutation({
    mutationFn: (orderId: string) =>
      apiPost<Order>(`/public/vendor/${token}/orders/${orderId}/dispatch`),
    onSuccess: async (_result, orderId) => {
      setSuccessId(orderId)
      setActionError(null)
      await queryClient.invalidateQueries({ queryKey: ['vendor-portal', token] })
      window.setTimeout(() => setSuccessId(null), 3000)
    },
    onError: (err) => {
      setActionError(getFriendlyErrorMessage(err, 'Unable to mark this order as dispatched.'))
    },
  })

  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 py-8">
      <header className="mb-6 text-center">
        <p className="font-display text-2xl font-semibold text-brand">Ennitant</p>
        <h1 className="mt-2 text-xl font-semibold text-ink">{data?.businessName || 'Vendor Portal'}</h1>
        {data?.vendorName ? <p className="mt-1 text-sm text-muted">{data.vendorName}</p> : null}
      </header>

      {successId ? (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-success" role="status">
          Order marked as dispatched.
        </div>
      ) : null}
      {actionError ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger" role="alert">
          {actionError}
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <ErrorState
          title="Link unavailable"
          description={getFriendlyErrorMessage(error, 'This vendor link is invalid or expired.')}
          onRetry={() => void refetch()}
        />
      ) : (
        <section aria-labelledby="dispatch-heading" className="space-y-3">
          <h2 id="dispatch-heading" className="text-lg font-semibold text-ink">
            Orders Ready for Dispatch
          </h2>
          {!data?.orders?.length ? (
            <EmptyState title="No orders ready." description="New orders will appear here when they are ready to dispatch." />
          ) : (
            <ul className="space-y-3">
              {data.orders.map((order) => {
                const firstItem = order.items?.[0]
                const dispatching =
                  dispatchMutation.isPending && dispatchMutation.variables === order.id
                return (
                  <li key={order.id} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-ink">
                          Order #{order.orderNumber || order.id.slice(0, 8)}
                        </p>
                        <p className="mt-1 text-sm text-muted">
                          {order.customer?.name || 'Customer'}
                          {order.customer?.phone ? ` · ${order.customer.phone}` : ''}
                        </p>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="mt-3 text-sm text-ink">
                      {firstItem
                        ? `${firstItem.name} × ${firstItem.quantity}`
                        : `${order.items?.length ?? 0} item(s)`}
                    </p>
                    <p className="mt-1 text-sm font-medium text-ink">
                      {formatCurrency(order.totalAmount, order.currency || 'USD')}
                    </p>
                    <Button
                      className="mt-4 w-full"
                      loading={dispatching}
                      onClick={() => dispatchMutation.mutate(order.id)}
                    >
                      Mark as Dispatched
                    </Button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
