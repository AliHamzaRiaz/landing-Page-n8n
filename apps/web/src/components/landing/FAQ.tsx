import { useId, useState } from 'react'
import { cn } from '@/lib/utils'

const faqs = [
  {
    question: 'Do I need technical knowledge?',
    answer:
      'No. Ennitant is designed for business owners who want a simple way to manage WhatsApp orders.',
  },
  {
    question: 'Do my customers need to install an app?',
    answer: 'No. Customers can place orders through WhatsApp.',
  },
  {
    question: 'Can I track my orders?',
    answer:
      'Yes. Orders are organized in your dashboard with real-time status updates.',
  },
  {
    question: 'Can my delivery team update orders?',
    answer: 'Yes. You can share a simple vendor/delivery link with your team.',
  },
  {
    question: 'Do I need to manage workflows?',
    answer: 'No. The automation runs in the background.',
  },
]

export function FAQ() {
  const baseId = useId()
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section
      id="faq"
      className="scroll-mt-20 bg-[color:var(--sky)]/60 py-20 sm:py-24"
      aria-labelledby="faq-heading"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-sky-700">FAQ</p>
          <h2
            id="faq-heading"
            className="mt-3 font-display text-3xl font-bold tracking-tight text-[color:var(--ocean)] sm:text-4xl"
          >
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-base text-[color:var(--muted)]">
            Straight answers for business owners evaluating Ennitant.
          </p>
        </div>

        <div className="landing-card mt-10 divide-y divide-teal-100 overflow-hidden rounded-2xl bg-white">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index
            const panelId = `${baseId}-panel-${index}`
            const buttonId = `${baseId}-button-${index}`
            return (
              <div key={faq.question} className={isOpen ? 'bg-[color:var(--lagoon)]/50' : ''}>
                <h3>
                  <button
                    id={buttonId}
                    type="button"
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-base font-bold text-[color:var(--ocean)] focus-ring sm:px-6"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                  >
                    {faq.question}
                    <span
                      className={cn(
                        'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white transition',
                        isOpen
                          ? 'rotate-45 bg-[color:var(--coral)]'
                          : 'bg-[color:var(--brand)]',
                      )}
                      aria-hidden
                    >
                      +
                    </span>
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  hidden={!isOpen}
                  className="px-5 pb-5 text-sm leading-relaxed text-[color:var(--muted)] sm:px-6"
                >
                  {faq.answer}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
