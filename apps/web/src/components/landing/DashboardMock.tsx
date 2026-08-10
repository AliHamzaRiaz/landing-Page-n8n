const orders = [
  {
    id: 'ORD-00001',
    customer: 'Ayesha Khan',
    product: 'Black Kurta',
    qty: 2,
    amount: 'PKR 4,000',
    status: 'Pending',
    tone: 'bg-amber-100 text-amber-900 ring-amber-300',
  },
  {
    id: 'ORD-00002',
    customer: 'Hassan Ali',
    product: 'White Shirt',
    qty: 1,
    amount: 'PKR 1,500',
    status: 'Confirmed',
    tone: 'bg-sky-100 text-sky-900 ring-sky-300',
  },
  {
    id: 'ORD-00003',
    customer: 'Fatima Noor',
    product: 'Blue Jeans',
    qty: 3,
    amount: 'PKR 7,500',
    status: 'Processing',
    tone: 'bg-orange-100 text-orange-900 ring-orange-300',
  },
  {
    id: 'ORD-00004',
    customer: 'Omar Raza',
    product: 'Leather Bag',
    qty: 1,
    amount: 'PKR 5,200',
    status: 'Shipped',
    tone: 'bg-teal-100 text-teal-900 ring-teal-300',
  },
  {
    id: 'ORD-00005',
    customer: 'Sara Ahmed',
    product: 'Cotton Scarf',
    qty: 4,
    amount: 'PKR 3,200',
    status: 'Delivered',
    tone: 'bg-emerald-100 text-emerald-900 ring-emerald-300',
  },
]

export function DashboardMock({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-teal-200/70 bg-white"
      role="img"
      aria-label="Ennitant order dashboard preview"
    >
      <div className="flex items-center gap-2 bg-[linear-gradient(90deg,var(--ocean),#0aa89a_55%,#ffb703)] px-4 py-3 shadow-[0_8px_16px_-10px_rgba(7,59,76,0.55)]">
        <span className="h-2.5 w-2.5 rounded-full bg-white/90 shadow-sm" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/70 shadow-sm" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/50 shadow-sm" />
        <span className="ml-3 text-xs font-semibold text-white drop-shadow-sm">Ennitant · Orders</span>
      </div>

      <div className={`grid gap-4 p-4 sm:p-5 ${compact ? '' : 'lg:grid-cols-[180px_1fr]'}`}>
        {!compact ? (
          <aside className="hidden space-y-1 rounded-xl bg-[linear-gradient(180deg,var(--lagoon),#fff)] p-3 lg:block" aria-hidden>
            {['Dashboard', 'Orders', 'Customers', 'Settings'].map((item, i) => (
              <div
                key={item}
                className={`rounded-xl px-3 py-2 text-sm ${
                  i === 1
                    ? 'bg-[linear-gradient(135deg,var(--brand),#12c4a8)] font-semibold text-white'
                    : 'text-[color:var(--muted)]'
                }`}
              >
                {item}
              </div>
            ))}
          </aside>
        ) : null}

        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--brand)]">
                Today
              </p>
              <p className="font-display text-xl font-bold text-[color:var(--ocean)] sm:text-2xl">
                Order overview
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'All', active: true, cls: 'bg-[color:var(--ocean)] text-white' },
                { label: 'Pending', active: false, cls: 'bg-amber-100 text-amber-900' },
                { label: 'Shipped', active: false, cls: 'bg-teal-100 text-teal-900' },
              ].map((filter) => (
                <span
                  key={filter.label}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${filter.cls}`}
                >
                  {filter.label}
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            <label className="sr-only" htmlFor="landing-order-search">
              Search orders
            </label>
            <input
              id="landing-order-search"
              readOnly
              tabIndex={-1}
              value="Search by order, customer, product…"
              className="w-full rounded-xl border border-teal-100 bg-[color:var(--lagoon)] px-3 py-2.5 text-sm text-[color:var(--muted)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: 'New', value: '12', bg: 'from-teal-50 to-emerald-50' },
              { label: 'Pending', value: '8', bg: 'from-amber-50 to-orange-50' },
              { label: 'Shipped', value: '5', bg: 'from-sky-50 to-cyan-50' },
              { label: 'Delivered', value: '21', bg: 'from-lime-50 to-teal-50' },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`rounded-xl border border-white bg-gradient-to-br ${stat.bg} px-3 py-2.5 shadow-sm`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--muted)]">
                  {stat.label}
                </p>
                <p className="mt-0.5 text-lg font-bold text-[color:var(--ocean)]">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto rounded-xl border border-teal-100">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-[color:var(--lagoon)] text-xs uppercase tracking-wide text-[color:var(--muted)]">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Order</th>
                  <th className="px-3 py-2.5 font-semibold">Customer</th>
                  <th className="px-3 py-2.5 font-semibold">Product</th>
                  <th className="px-3 py-2.5 font-semibold">Qty</th>
                  <th className="px-3 py-2.5 font-semibold">Amount</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-teal-50">
                {orders.slice(0, compact ? 3 : 5).map((order) => (
                  <tr key={order.id} className="bg-white">
                    <td className="px-3 py-3 font-semibold text-[color:var(--ocean)]">{order.id}</td>
                    <td className="px-3 py-3 text-[color:var(--muted)]">{order.customer}</td>
                    <td className="px-3 py-3 text-[color:var(--muted)]">{order.product}</td>
                    <td className="px-3 py-3 text-[color:var(--muted)]">{order.qty}</td>
                    <td className="px-3 py-3 font-medium text-[color:var(--ocean)]">{order.amount}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-lg px-2 py-1 text-xs font-semibold ring-1 ring-inset ${order.tone}`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
