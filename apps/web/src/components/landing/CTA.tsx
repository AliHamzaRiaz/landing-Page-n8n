import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export function CTA() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-24">
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          backgroundImage:
            'radial-gradient(ellipse 60% 80% at 10% 50%, rgba(10,168,154,0.25), transparent 55%), radial-gradient(ellipse 50% 70% at 90% 40%, rgba(255,183,3,0.28), transparent 50%), radial-gradient(ellipse 40% 50% at 50% 100%, rgba(255,107,74,0.18), transparent 55%), linear-gradient(180deg, #fff, #eefbf8)',
        }}
      />
      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="font-display text-3xl font-bold tracking-tight text-[color:var(--ocean)] sm:text-4xl">
          Ready to Simplify Your WhatsApp Orders?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-[color:var(--muted)] sm:text-lg">
          Start managing your orders in one simple dashboard.
        </p>
        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Link to="/signup" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="landing-3d-btn h-12 w-full min-w-[170px] rounded-xl bg-[linear-gradient(135deg,var(--brand),#12c4a8)] sm:w-auto"
            >
              Get Started
            </Button>
          </Link>
          <Link to="/login" className="w-full sm:w-auto">
            <Button
              size="lg"
              variant="outline"
              className="h-12 w-full min-w-[170px] rounded-xl border-2 border-[color:var(--ocean)]/20 bg-white text-[color:var(--ocean)] hover:bg-[color:var(--peach)] sm:w-auto"
            >
              Login
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
