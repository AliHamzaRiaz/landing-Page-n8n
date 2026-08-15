import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Footer } from '@/components/landing/Footer'
import { Button } from '@/components/ui/Button'

export const LEGAL_CONTACT = 'hamzagujjarriaz3@gmail.com'
export const LEGAL_UPDATED = '15 August 2026'

type Section = {
  id: string
  title: string
  paragraphs: string[]
  bullets?: string[]
}

export function LegalDocumentPage({
  title,
  intro,
  toc,
  sections,
  contactHeading,
  contactIntro,
  children,
}: {
  title: string
  intro: string
  toc: Array<{ id: string; title: string }>
  sections: Section[]
  contactHeading: string
  contactIntro: string
  children?: ReactNode
}) {
  return (
    <div className="landing-shell min-h-screen">
      <header className="sticky top-0 z-50 border-b border-[color:var(--border)] bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/"
            className="font-display text-xl font-bold tracking-tight focus-ring sm:text-2xl"
            style={{
              backgroundImage: 'linear-gradient(120deg, var(--ocean), var(--brand) 55%, #16c2b0)',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Ennitant
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="rounded-xl px-3 py-2 text-sm font-semibold text-[color:var(--ocean)] transition hover:bg-[color:var(--lagoon)] focus-ring"
            >
              Login
            </Link>
            <Link to="/signup">
              <Button className="landing-3d-btn rounded-xl bg-[linear-gradient(135deg,var(--brand),#12c4a8)]">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-sm font-medium text-brand">Legal</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-ink">{title}</h1>
        <p className="mt-3 text-sm text-muted">Last updated: {LEGAL_UPDATED}</p>
        <p className="mt-6 text-base leading-relaxed text-ink">{intro}</p>

        <nav className="mt-8 rounded-xl border border-border bg-surface p-5" aria-label="On this page">
          <p className="text-sm font-semibold text-ink">On this page</p>
          <ol className="mt-3 grid gap-2 text-sm text-brand sm:grid-cols-2">
            {toc.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="rounded hover:underline focus-ring">
                  {item.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="mt-10 space-y-10 text-sm leading-relaxed text-ink sm:text-base">
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="font-display text-xl font-semibold text-ink">{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="mt-3 text-muted">
                  {paragraph}
                </p>
              ))}
              {section.bullets ? (
                <ul className="mt-3 list-disc space-y-2 pl-5 text-muted">
                  {section.bullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}

          <section id="contact" className="scroll-mt-24">
            <h2 className="font-display text-xl font-semibold text-ink">{contactHeading}</h2>
            <p className="mt-3 text-muted">{contactIntro}</p>
            <p className="mt-2 font-medium text-ink">
              <a
                href={`mailto:${LEGAL_CONTACT}`}
                className="rounded text-brand hover:underline focus-ring"
              >
                {LEGAL_CONTACT}
              </a>
            </p>
            {children}
          </section>
        </article>
      </main>

      <Footer />
    </div>
  )
}
