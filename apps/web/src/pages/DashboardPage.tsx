import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Copy, Share2, Sparkles, Truck, PackageCheck, Clock3 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { AppShell } from '@/components/layout/AppShell'
import { StatusBadge } from '@/components/orders/StatusBadge'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { apiGet, getFriendlyErrorMessage } from '@/lib/api'
import { formatCurrency, timeOfDayGreeting } from '@/lib/utils'
import type { DashboardStats, OrderStatus } from '@/types'

const summaryCards: Array<{
  key: keyof Pick<DashboardStats, 'newOrders' | 'pending' | 'dispatched' | 'delivered'>
  label: string
  status: OrderStatus
  icon: typeof Sparkles
  tone: string
  valueTone: string
}> = [
  {
    key: 'newOrders',
    label: 'New Orders',
    status: 'PENDING',
    icon: Sparkles,
    tone: 'text-amber-600 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200/80',
    valueTone: 'text-amber-950',
  },
  {
    key: 'pending',
    label: 'Pending',
    status: 'CONFIRMED',
    icon: Clock3,
    tone: 'text-indigo-600 bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-200/80',
    valueTone: 'text-indigo-950',
  },
  {
    key: 'dispatched',
    label: 'Dispatched',
    status: 'DISPATCHED',
    icon: Truck,
    tone: 'text-sky-600 bg-gradient-to-br from-sky-50 to-cyan-50 border-sky-200/80',
    valueTone: 'text-sky-950',
  },
  {
    key: 'delivered',
    label: 'Delivered',
    status: 'DELIVERED',
    icon: PackageCheck,
    tone: 'text-emerald-600 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200/80',
    valueTone: 'text-emerald-950',
  },
]

export function DashboardPage() {
  const navigate = useNavigate()
  const [banner, setBanner] = useState<string | null>(null)
  const previousNewOrders = useRef<number | null>(null)

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiGet<DashboardStats>('/dashboard'),
    refetchInterval: 8000,
  })

  const campaignStats = useQuery({
    queryKey: ['campaign-analytics'],
    queryFn: () =>
      apiGet<{
        totals: {
          campaigns: number
          activeCampaigns: number
          scheduledPosts: number
          publishedPosts: number
          failedPosts: number
          connectedAccounts: number
        }
      }>('/analytics'),
  })

  useEffect(() => {
    if (typeof data?.newOrders !== 'number') return
    const previous = previousNewOrders.current
    previousNewOrders.current = data.newOrders
    if (previous !== null && data.newOrders > previous) {
      setBanner('New Order Received')
      const id = window.setTimeout(() => setBanner(null), 5000)
      return () => window.clearTimeout(id)
    }
  }, [data?.newOrders])

  async function copyLink(link: string) {
    try {
      await navigator.clipboard.writeText(link)
      setBanner('Link copied')
      window.setTimeout(() => setBanner(null), 2500)
    } catch {
      setBanner('Unable to copy link')
      window.setTimeout(() => setBanner(null), 2500)
    }
  }

  async function shareLink(link: string, title: string) {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: link, text: title })
        return
      } catch {
        // Fall through to copy when share is cancelled or unavailable.
      }
    }
    await copyLink(link)
  }

  return (
    <AppShell title="Dashboard">
      <div className="space-y-6">
        {banner ? (
          <div
            className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-900 shadow-sm"
            role="status"
          >
            {banner}
          </div>
        ) : null}

        {error ? (
          <ErrorState
            description={getFriendlyErrorMessage(error, "We couldn't load your dashboard. Please try again.")}
            onRetry={() => void refetch()}
          />
        ) : (
          <>
            <section className="app-panel relative overflow-hidden rounded-2xl p-5 sm:p-6">
              <div
                className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-400/20 blur-2xl"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -bottom-12 left-10 h-36 w-36 rounded-full bg-amber-300/20 blur-2xl"
                aria-hidden
              />
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">Overview</p>
              <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                {timeOfDayGreeting()}, {data?.companyName || 'there'}
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-muted sm:text-base">
                Track WhatsApp orders, share customer and vendor links, and keep fulfillment moving —
                all in one place.
              </p>
            </section>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((card) => {
                const Icon = card.icon
                return (
                  <button
                    key={card.key}
                    type="button"
                    onClick={() => navigate(`/orders?status=${card.status}`)}
                    className={`app-stat app-panel rounded-2xl border p-4 text-left focus-ring ${card.tone}`}
                  >
                    <div className="relative z-10 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold opacity-80">{card.label}</p>
                        <p className={`mt-2 text-3xl font-bold ${card.valueTone}`}>
                          {isLoading || isFetching ? '—' : (data?.[card.key] ?? 0)}
                        </p>
                      </div>
                      <span className="rounded-xl bg-white/80 p-2 shadow-sm">
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <article className="app-panel overflow-hidden rounded-2xl border border-teal-200/70 bg-gradient-to-br from-teal-50 via-white to-emerald-50">
                <div className="border-b border-teal-100 px-5 py-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
                    Customer link
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-ink">Customer Order Link</h2>
                  <p className="mt-1 text-sm text-muted">
                    Share this so customers can order directly on WhatsApp.
                  </p>
                </div>
                <div className="space-y-3 p-5">
                  <p className="break-all rounded-xl border border-teal-100 bg-white px-3 py-2.5 text-sm font-medium text-ink shadow-sm">
                    {data?.customerOrderLink || 'Loading link…'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl border-teal-200"
                      disabled={!data?.customerOrderLink}
                      onClick={() => data?.customerOrderLink && void copyLink(data.customerOrderLink)}
                    >
                      <Copy className="h-4 w-4" aria-hidden />
                      Copy Link
                    </Button>
                    <Button
                      size="sm"
                      className="rounded-xl bg-teal-600 hover:bg-teal-700"
                      disabled={!data?.customerOrderLink}
                      onClick={() =>
                        data?.customerOrderLink &&
                        void shareLink(data.customerOrderLink, 'Order on WhatsApp')
                      }
                    >
                      <Share2 className="h-4 w-4" aria-hidden />
                      Share
                    </Button>
                  </div>
                </div>
              </article>

              <article className="app-panel overflow-hidden rounded-2xl border border-orange-200/70 bg-gradient-to-br from-orange-50 via-white to-amber-50">
                <div className="border-b border-orange-100 px-5 py-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-orange-700">
                    Vendor link
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-ink">Vendor Dispatch Link</h2>
                  <p className="mt-1 text-sm text-muted">
                    Share with warehouse or delivery to update dispatch status.
                  </p>
                </div>
                <div className="space-y-3 p-5">
                  <p className="break-all rounded-xl border border-orange-100 bg-white px-3 py-2.5 text-sm font-medium text-ink shadow-sm">
                    {data?.vendorDispatchLink || 'Loading link…'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl border-orange-200"
                      disabled={!data?.vendorDispatchLink}
                      onClick={() => data?.vendorDispatchLink && void copyLink(data.vendorDispatchLink)}
                    >
                      <Copy className="h-4 w-4" aria-hidden />
                      Copy Link
                    </Button>
                    <Button
                      size="sm"
                      className="rounded-xl bg-orange-500 hover:bg-orange-600"
                      disabled={!data?.vendorDispatchLink}
                      onClick={() =>
                        data?.vendorDispatchLink &&
                        void shareLink(data.vendorDispatchLink, 'Vendor dispatch portal')
                      }
                    >
                      <Share2 className="h-4 w-4" aria-hidden />
                      Share
                    </Button>
                  </div>
                </div>
              </article>
            </div>

            {campaignStats.data?.totals ? (
              <section aria-labelledby="campaign-overview-heading" className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 id="campaign-overview-heading" className="text-lg font-bold text-ink">
                    Campaigns
                  </h2>
                  <Link
                    to="/campaigns"
                    className="rounded-xl bg-fuchsia-50 px-3 py-1.5 text-sm font-semibold text-fuchsia-700 transition hover:bg-fuchsia-100"
                  >
                    Open
                  </Link>
                </div>
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  {(
                    [
                      ['Total', campaignStats.data.totals.campaigns],
                      ['Active', campaignStats.data.totals.activeCampaigns],
                      ['Scheduled', campaignStats.data.totals.scheduledPosts],
                      ['Published', campaignStats.data.totals.publishedPosts],
                      ['Failed', campaignStats.data.totals.failedPosts],
                      ['Accounts', campaignStats.data.totals.connectedAccounts],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label} className="app-panel rounded-2xl p-4">
                      <p className="text-xs text-muted">{label}</p>
                      <p className="mt-1 text-xl font-bold text-ink">{value}</p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section aria-labelledby="recent-orders-heading" className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Live feed</p>
                  <h2 id="recent-orders-heading" className="text-lg font-bold text-ink">
                    Recent Orders
                  </h2>
                </div>
                <Link
                  to="/orders"
                  className="rounded-xl bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
                >
                  View all
                </Link>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Spinner />
                </div>
              ) : !data?.recentOrders?.length ? (
                <div className="app-panel rounded-2xl p-2">
                  <EmptyState
                    title="No orders yet."
                    description="Share your customer order link to get started."
                  />
                </div>
              ) : (
                <ul className="space-y-3">
                  {data.recentOrders.map((order) => {
                    const firstItem = order.items?.[0]
                    return (
                      <li key={order.id}>
                        <Link
                          to={`/orders/${order.id}`}
                          className="app-panel block rounded-2xl border border-slate-200/80 p-4 transition hover:-translate-y-0.5 hover:border-indigo-200 focus-ring"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="font-bold text-ink">
                                Order #{order.orderNumber || order.id.slice(0, 8)}
                              </p>
                              <p className="mt-1 text-sm text-muted">
                                {order.customer?.name || 'Customer'} · {order.customer?.phone || '—'}
                              </p>
                            </div>
                            <StatusBadge status={order.status} />
                          </div>
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                            <p className="text-slate-700">
                              {firstItem
                                ? `${firstItem.name} × ${firstItem.quantity}`
                                : `${order.items?.length ?? 0} item(s)`}
                            </p>
                            <p className="font-bold text-ink">
                              {formatCurrency(
                                order.totalAmount,
                                data.currency || order.currency || 'USD',
                              )}
                            </p>
                          </div>
                          <p className="mt-2 text-xs text-muted">
                            {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                          </p>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  )
}
