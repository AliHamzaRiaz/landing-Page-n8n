import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="landing-shell relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="landing-orb left-[-5rem] top-16 h-64 w-64 bg-[color:var(--brand)]" aria-hidden />
      <div className="landing-orb right-[-4rem] top-28 h-72 w-72 bg-[color:var(--mango)]" aria-hidden />
      <div
        className="landing-orb bottom-8 left-1/3 h-52 w-52 bg-[color:var(--coral)] opacity-40"
        aria-hidden
      />

      <div className="relative w-full max-w-md animate-slide-up">
        <div className="mb-6 text-center">
          <Link
            to="/"
            className="font-display text-3xl font-bold tracking-tight focus-ring"
            style={{
              backgroundImage: 'linear-gradient(120deg, var(--ocean), var(--brand) 55%, #16c2b0)',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Ennitant
          </Link>
          <p className="mt-2 text-sm font-medium text-[color:var(--muted)]">
            WhatsApp orders, one simple dashboard
          </p>
        </div>

        <div className="landing-perspective">
          <div className="landing-3d-panel overflow-hidden rounded-2xl border border-teal-200/80 bg-white/95">
            <div className="h-1.5 bg-[linear-gradient(90deg,var(--ocean),var(--brand),var(--mango),var(--coral))]" />
            <div className="px-6 pb-6 pt-5 sm:px-8 sm:pb-8 sm:pt-6">
              <h1 className="font-display text-2xl font-bold text-[color:var(--ocean)]">{title}</h1>
              <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--muted)]">{description}</p>
              <div className="mt-6">{children}</div>
              {footer ? <div className="mt-5 text-center text-sm text-[color:var(--muted)]">{footer}</div> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
