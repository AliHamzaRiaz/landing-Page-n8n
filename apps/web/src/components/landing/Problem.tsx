const problems = [
  {
    title: 'Orders scattered across chats',
    description: 'Important requests get buried in WhatsApp conversations and group messages.',
    accent: 'bg-[color:var(--coral)]',
    wash: 'from-rose-50 to-orange-50',
  },
  {
    title: 'Manual spreadsheet updates',
    description: 'Copying orders into Excel or Google Sheets wastes time and creates mistakes.',
    accent: 'bg-[color:var(--mango)]',
    wash: 'from-amber-50 to-yellow-50',
  },
  {
    title: 'Hard to track status',
    description: 'Knowing what is pending, shipped, or delivered becomes guesswork.',
    accent: 'bg-sky-400',
    wash: 'from-sky-50 to-cyan-50',
  },
  {
    title: 'Customers asking for updates',
    description: 'Your team spends the day answering “Where is my order?” messages.',
    accent: 'bg-[color:var(--brand)]',
    wash: 'from-teal-50 to-emerald-50',
  },
  {
    title: 'Constant vendor coordination',
    description: 'Warehouse and delivery staff need repeated follow-ups to stay aligned.',
    accent: 'bg-orange-400',
    wash: 'from-orange-50 to-amber-50',
  },
  {
    title: 'Missed or duplicated orders',
    description: 'Without one source of truth, orders slip through or get entered twice.',
    accent: 'bg-fuchsia-400',
    wash: 'from-fuchsia-50 to-rose-50',
  },
]

export function Problem() {
  return (
    <section className="relative py-20 sm:py-24" aria-labelledby="problem-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--coral)]">
            The problem
          </p>
          <h2
            id="problem-heading"
            className="mt-3 font-display text-3xl font-bold tracking-tight text-[color:var(--ocean)] sm:text-4xl"
          >
            Still Managing WhatsApp Orders Manually?
          </h2>
          <p className="mt-4 text-base text-[color:var(--muted)] sm:text-lg">
            Growing WhatsApp sales should not mean more chaos. These everyday problems slow businesses
            down.
          </p>
        </div>

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {problems.map((item) => (
            <li
              key={item.title}
              className={`landing-card rounded-2xl bg-gradient-to-br ${item.wash} p-5`}
            >
              <div className={`mb-3 h-1.5 w-10 rounded-full ${item.accent}`} aria-hidden />
              <h3 className="text-base font-bold text-[color:var(--ocean)]">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[color:var(--muted)]">
                {item.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
