const benefits = [
  { label: 'No spreadsheets', tone: 'bg-teal-100 text-teal-900' },
  { label: 'No complicated setup', tone: 'bg-amber-100 text-amber-900' },
  { label: 'Faster order processing', tone: 'bg-sky-100 text-sky-900' },
  { label: 'Centralized order management', tone: 'bg-orange-100 text-orange-900' },
  { label: 'Better customer experience', tone: 'bg-emerald-100 text-emerald-900' },
  { label: 'Easy team coordination', tone: 'bg-rose-100 text-rose-900' },
  { label: 'Real-time order visibility', tone: 'bg-cyan-100 text-cyan-900' },
]

export function Benefits() {
  return (
    <section
      id="benefits"
      className="scroll-mt-20 bg-gradient-to-br from-[color:var(--peach)] via-white to-[color:var(--lagoon)] py-20 sm:py-24"
      aria-labelledby="benefits-heading"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--coral)]">
            Why Ennitant
          </p>
          <h2
            id="benefits-heading"
            className="mt-3 font-display text-3xl font-bold tracking-tight text-[color:var(--ocean)] sm:text-4xl"
          >
            Less Manual Work. More Control.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[color:var(--muted)] sm:text-lg">
            Ennitant keeps WhatsApp sales organized so you can focus on customers and fulfillment —
            not copy-paste work.
          </p>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2">
          {benefits.map((benefit) => (
            <li
              key={benefit.label}
              className={`landing-card flex items-center gap-3 rounded-xl px-4 py-3.5 ${benefit.tone}`}
            >
              <span
                className="inline-flex h-2.5 w-2.5 shrink-0 rounded-sm bg-[color:var(--ocean)]"
                aria-hidden
              />
              <span className="text-sm font-bold sm:text-base">{benefit.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
