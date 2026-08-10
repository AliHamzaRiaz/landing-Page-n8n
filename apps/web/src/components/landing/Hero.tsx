import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { DashboardMock } from '@/components/landing/DashboardMock'

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-16 pt-8 sm:pb-20 sm:pt-12">
      <div
        className="landing-orb left-[-6rem] top-10 h-64 w-64 bg-[color:var(--brand)]"
        aria-hidden
      />
      <div
        className="landing-orb right-[-4rem] top-24 h-72 w-72 bg-[color:var(--mango)]"
        aria-hidden
      />
      <div
        className="landing-orb bottom-10 left-1/3 h-56 w-56 bg-[color:var(--coral)] opacity-40"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p
            className="font-display text-4xl font-bold tracking-tight sm:text-5xl animate-fade-in"
            style={{
              backgroundImage: 'linear-gradient(120deg, var(--ocean), var(--brand) 50%, #1ad4bc)',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Ennitant
          </p>
          <h1 className="mt-4 font-display text-3xl font-bold leading-[1.12] tracking-tight text-[color:var(--ocean)] sm:text-5xl md:text-[3.35rem] animate-slide-up">
            Turn WhatsApp Orders Into a Simple, Automated Business
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[color:var(--muted)] sm:text-lg animate-slide-up animate-delay-1">
            Receive customer orders on WhatsApp, manage them in one place, and keep your team updated
            — without spreadsheets or complicated software.
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center animate-slide-up animate-delay-2">
            <Link to="/signup" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="landing-3d-btn h-12 w-full min-w-[170px] rounded-xl bg-[linear-gradient(135deg,var(--brand),#12c4a8)] sm:w-auto"
              >
                Get Started
              </Button>
            </Link>
            <a href="#how-it-works" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="h-12 w-full min-w-[170px] rounded-xl border-2 border-[color:var(--ocean)]/15 bg-white/90 text-[color:var(--ocean)] shadow-[0_8px_0_rgba(10,37,64,0.08),0_12px_24px_-12px_rgba(7,59,76,0.25)] hover:bg-[color:var(--peach)] sm:w-auto"
              >
                See How It Works
              </Button>
            </a>
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-5xl animate-slide-up animate-delay-3">
          <div className="mb-6 flex flex-wrap items-center justify-center gap-2 text-sm font-semibold sm:gap-3">
            <span className="rounded-xl bg-[color:var(--lagoon)] px-3 py-1.5 text-[color:var(--ocean)] shadow-[0_6px_0_rgba(10,168,154,0.18)] ring-1 ring-teal-200/80">
              WhatsApp order
            </span>
            <span className="text-[color:var(--mango)]" aria-hidden>
              →
            </span>
            <span className="rounded-xl bg-[color:var(--peach)] px-3 py-1.5 text-[color:var(--ocean)] shadow-[0_6px_0_rgba(255,138,61,0.22)] ring-1 ring-orange-200/80">
              Automatic processing
            </span>
            <span className="text-[color:var(--coral)]" aria-hidden>
              →
            </span>
            <span className="rounded-xl bg-[color:var(--sky)] px-3 py-1.5 text-[color:var(--ocean)] shadow-[0_6px_0_rgba(56,189,248,0.22)] ring-1 ring-sky-200/80">
              Your dashboard
            </span>
          </div>
          <div className="landing-perspective px-2 sm:px-6">
            <div className="landing-3d-panel landing-float rounded-2xl">
              <DashboardMock compact />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
