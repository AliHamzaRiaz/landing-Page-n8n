import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { OrderFilters, type OrderFilterState } from '@/components/orders/OrderFilters'
import { OrdersTable } from '@/components/orders/OrdersTable'
import { OrderDetailsDrawer } from '@/components/orders/OrderDetailsDrawer'
import { ErrorState } from '@/components/ui/ErrorState'
import { apiGet, getFriendlyErrorMessage } from '@/lib/api'
import type { Order, OrderStatus, Paginated } from '@/types'

const STATUS_VALUES: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'DISPATCHED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
]

export function OrdersPage() {
  const [params] = useSearchParams()
  const initialStatus = params.get('status')
  const [filters, setFilters] = useState<OrderFilterState>({
    search: '',
    status: STATUS_VALUES.includes(initialStatus as OrderStatus)
      ? (initialStatus as OrderStatus)
      : '',
    from: '',
    to: '',
    sort: 'createdAt_desc',
  })
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Order | null>(null)

  const queryParams = useMemo(
    () => ({
      page,
      pageSize: 10,
      search: filters.search || undefined,
      status: filters.status || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
      sort: filters.sort,
    }),
    [filters, page],
  )

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['orders', queryParams],
    queryFn: () => apiGet<Paginated<Order> | Order[]>('/orders', queryParams),
  })

  const orders = Array.isArray(data) ? data : (data?.items ?? [])
  const totalPages = Array.isArray(data) ? 1 : (data?.totalPages ?? 1)

  return (
    <AppShell title="Orders">
      <div className="space-y-4">
        <section className="app-panel rounded-2xl border border-sky-200/70 bg-gradient-to-r from-sky-50 via-white to-cyan-50 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">Orders desk</p>
          <h2 className="mt-1 font-display text-xl font-bold text-ink">Manage every WhatsApp order</h2>
          <p className="mt-1 text-sm text-muted">
            Filter by status, search customers, and open any order for full details.
          </p>
        </section>
        <OrderFilters
          value={filters}
          onChange={(next) => {
            setPage(1)
            setFilters(next)
          }}
        />
        {error ? (
          <ErrorState description={getFriendlyErrorMessage(error)} onRetry={() => void refetch()} />
        ) : (
          <div className="app-panel overflow-hidden rounded-2xl">
            <OrdersTable
              orders={orders}
              loading={isLoading}
              onOpen={setSelected}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
      <OrderDetailsDrawer
        order={selected}
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
      />
    </AppShell>
  )
}
