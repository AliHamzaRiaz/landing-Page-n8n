import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export function ShareLinks() {
  return (
    <section className="py-20 sm:py-24" aria-labelledby="links-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--mango)]">
            Share & grow
          </p>
          <h2
            id="links-heading"
            className="mt-3 font-display text-3xl font-bold tracking-tight text-[color:var(--ocean)] sm:text-4xl"
          >
            Two Simple Links. Everything Connected.
          </h2>
          <p className="mt-4 text-base text-[color:var(--muted)] sm:text-lg">
            Share the right link with customers and your delivery team — no training required.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <article className="landing-card overflow-hidden rounded-2xl bg-gradient-to-br from-[color:var(--lagoon)] to-white">
            <div className="border-b border-teal-100 px-6 py-5">
              <p className="text-xs font-bold uppercase tracking-wider text-[color:var(--brand)]">
                Customer order link
              </p>
              <h3 className="mt-2 text-xl font-bold text-[color:var(--ocean)]">
                Let customers order directly through WhatsApp
              </h3>
              <p className="mt-2 text-sm text-[color:var(--muted)]">
                Your customers open a simple page, tap Order on WhatsApp, and send their request. You
                see it in the dashboard.
              </p>
            </div>
            <div className="space-y-3 px-6 py-6" aria-hidden>
              <div className="rounded-xl border border-dashed border-teal-300 bg-white px-4 py-3 text-sm font-medium text-[color:var(--ocean)]">
                ennitant.com/order/your-business
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                <span className="rounded-lg bg-teal-500 px-2 py-1 text-white">Customer</span>
                <span className="text-[color:var(--mango)]">→</span>
                <span className="rounded-lg bg-sky-400 px-2 py-1 text-white">WhatsApp</span>
                <span className="text-[color:var(--mango)]">→</span>
                <span className="rounded-lg bg-[color:var(--ocean)] px-2 py-1 text-white">
                  Your orders
                </span>
              </div>
            </div>
            <div className="px-6 pb-6">
              <Link to="/signup">
                <Button className="landing-3d-btn w-full rounded-xl bg-[linear-gradient(135deg,var(--brand),#12c4a8)] sm:w-auto">
                  Share Customer Link
                </Button>
              </Link>
            </div>
          </article>

          <article className="landing-card overflow-hidden rounded-2xl bg-gradient-to-br from-[color:var(--peach)] to-white">
            <div className="border-b border-orange-100 px-6 py-5">
              <p className="text-xs font-bold uppercase tracking-wider text-[color:var(--coral)]">
                Vendor / delivery link
              </p>
              <h3 className="mt-2 text-xl font-bold text-[color:var(--ocean)]">
                Update dispatch status without chasing your team
              </h3>
              <p className="mt-2 text-sm text-[color:var(--muted)]">
                Give your warehouse or delivery staff a secure link to mark orders as dispatched —
                your dashboard updates automatically.
              </p>
            </div>
            <div className="space-y-3 px-6 py-6" aria-hidden>
              <div className="rounded-xl border border-dashed border-orange-300 bg-white px-4 py-3 text-sm font-medium text-[color:var(--ocean)]">
                ennitant.com/vendor/secure-link
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                <span className="rounded-lg bg-[color:var(--mango)] px-2 py-1 text-[color:var(--ocean)]">
                  Warehouse
                </span>
                <span className="text-[color:var(--coral)]">→</span>
                <span className="rounded-lg bg-[color:var(--coral)] px-2 py-1 text-white">
                  Mark dispatched
                </span>
                <span className="text-[color:var(--coral)]">→</span>
                <span className="rounded-lg bg-[color:var(--ocean)] px-2 py-1 text-white">
                  Live status
                </span>
              </div>
            </div>
            <div className="px-6 pb-6">
              <Link to="/signup">
                <Button className="landing-3d-btn w-full rounded-xl bg-[linear-gradient(135deg,var(--mango),var(--coral))] text-[color:var(--ocean)] sm:w-auto">
                  Share Vendor Link
                </Button>
              </Link>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}
