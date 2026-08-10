const features = [
  {
    title: 'WhatsApp Orders',
    description: 'Customers place orders directly through WhatsApp — no new app for them to install.',
    badge: 'bg-[color:var(--lagoon)] text-[color:var(--ocean)]',
    bar: 'from-[color:var(--brand)] to-emerald-300',
  },
  {
    title: 'Automatic Order Management',
    description: 'Orders are captured and organized in your dashboard so nothing gets lost in chat.',
    badge: 'bg-[color:var(--peach)] text-[color:var(--ocean)]',
    bar: 'from-[color:var(--mango)] to-orange-300',
  },
  {
    title: 'Real-Time Order Tracking',
    description: 'See Pending, Confirmed, Processing, Shipped, and Delivered statuses at a glance.',
    badge: 'bg-[color:var(--sky)] text-[color:var(--ocean)]',
    bar: 'from-sky-400 to-cyan-300',
  },
  {
    title: 'Vendor / Delivery Updates',
    description:
      'Share a simple link with your warehouse or delivery team to update dispatch status.',
    badge: 'bg-rose-50 text-rose-800',
    bar: 'from-[color:var(--coral)] to-rose-300',
  },
]

export function Features() {
  return (
    <section
      id="features"
      className="scroll-mt-20 bg-[color:var(--ocean)] py-20 text-white sm:py-24"
      aria-labelledby="features-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--mango)]">
            Solution
          </p>
          <h2
            id="features-heading"
            className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Everything Your WhatsApp Business Needs, In One Place
          </h2>
          <p className="mt-4 text-base text-teal-100 sm:text-lg">
            Built for business owners who want clarity — not complicated tools.
          </p>
        </div>

        <ul className="mt-12 grid gap-5 sm:grid-cols-2">
          {features.map((feature, index) => (
            <li
              key={feature.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition hover:bg-white/10"
            >
              <div className={`mb-4 h-1.5 w-16 rounded-full bg-gradient-to-r ${feature.bar}`} />
              <span
                className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${feature.badge}`}
              >
                0{index + 1}
              </span>
              <h3 className="mt-4 text-xl font-bold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-teal-50/90 sm:text-base">
                {feature.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
