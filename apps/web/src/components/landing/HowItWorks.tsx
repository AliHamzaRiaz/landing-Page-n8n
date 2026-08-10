const steps = [
  {
    step: 'Step 1',
    title: 'Connect Your Business',
    description: 'Enter your company name and business WhatsApp number. That is all you need to get started.',
    detail: 'Company name · Business WhatsApp number',
    tone: 'bg-[color:var(--lagoon)] border-teal-200',
    number: 'bg-[linear-gradient(135deg,var(--brand),#12c4a8)]',
  },
  {
    step: 'Step 2',
    title: 'Share Your WhatsApp Link',
    description: 'Give customers your ordering link so they can place orders on WhatsApp in seconds.',
    detail: 'One shareable customer link',
    tone: 'bg-[color:var(--peach)] border-orange-200',
    number: 'bg-[linear-gradient(135deg,var(--mango),#ff8a3d)]',
  },
  {
    step: 'Step 3',
    title: 'Manage Orders Automatically',
    description: 'Orders appear in your dashboard and statuses stay updated as your team progresses them.',
    detail: 'Dashboard · Status updates',
    tone: 'bg-[color:var(--sky)] border-sky-200',
    number: 'bg-[linear-gradient(135deg,#38bdf8,#0aa89a)]',
  },
]

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 py-20 sm:py-24"
      aria-labelledby="how-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--brand)]">
            Simple path
          </p>
          <h2
            id="how-heading"
            className="mt-3 font-display text-3xl font-bold tracking-tight text-[color:var(--ocean)] sm:text-4xl"
          >
            How It Works
          </h2>
          <p className="mt-4 text-base text-[color:var(--muted)] sm:text-lg">
            Three simple steps. No technical setup for you to learn.
          </p>
        </div>

        <ol className="relative mt-14 grid gap-6 lg:grid-cols-3">
          {steps.map((item, index) => (
            <li
              key={item.title}
              className={`landing-card relative rounded-2xl border p-6 text-center ${item.tone}`}
            >
              <div
                className={`landing-step-orb mx-auto flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-bold text-white ${item.number}`}
              >
                {index + 1}
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-[color:var(--ocean)]/70">
                {item.step}
              </p>
              <h3 className="mt-2 text-xl font-bold text-[color:var(--ocean)]">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[color:var(--muted)]">
                {item.description}
              </p>
              <p className="mt-4 rounded-xl bg-white/80 px-3 py-2 text-xs font-semibold text-[color:var(--ocean)]">
                {item.detail}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
