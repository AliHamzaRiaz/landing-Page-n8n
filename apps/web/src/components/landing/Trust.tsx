const testimonials = [
  {
    quote:
      'We finally stopped losing orders in WhatsApp chats. Everything shows up in one place for the team.',
    role: 'Fashion boutique owner',
    wash: 'from-teal-50 to-white',
    accent: 'text-[color:var(--brand)]',
  },
  {
    quote:
      'Our delivery staff updates dispatch from their phones. I do not have to chase anyone for status.',
    role: 'Wholesale seller',
    wash: 'from-orange-50 to-white',
    accent: 'text-[color:var(--coral)]',
  },
  {
    quote:
      'Setup felt simple. I shared my customer link the same day and started seeing orders in the dashboard.',
    role: 'Home goods retailer',
    wash: 'from-sky-50 to-white',
    accent: 'text-sky-600',
  },
]

export function Trust() {
  return (
    <section className="py-20 sm:py-24" aria-labelledby="trust-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--brand)]">
            Built for sellers
          </p>
          <h2
            id="trust-heading"
            className="mt-3 font-display text-3xl font-bold tracking-tight text-[color:var(--ocean)] sm:text-4xl"
          >
            Built for businesses that sell through WhatsApp
          </h2>
          <p className="mt-4 text-base text-[color:var(--muted)] sm:text-lg">
            Designed for non-technical owners who want order clarity without hiring a tech team.
          </p>
        </div>

        <ul className="mt-12 grid gap-5 md:grid-cols-3">
          {testimonials.map((item) => (
            <li
              key={item.role}
              className={`landing-card flex flex-col rounded-2xl bg-gradient-to-br ${item.wash} p-6`}
            >
              <p className={`text-3xl font-bold ${item.accent}`} aria-hidden>
                “
              </p>
              <p className="flex-1 text-sm leading-relaxed text-[color:var(--ocean)] sm:text-base">
                {item.quote}
              </p>
              <p className="mt-6 text-sm font-bold text-[color:var(--ocean)]">{item.role}</p>
              <p className="text-xs font-medium text-[color:var(--muted)]">Placeholder testimonial</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
