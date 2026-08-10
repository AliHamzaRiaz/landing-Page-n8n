import { DashboardMock } from '@/components/landing/DashboardMock'

export function DashboardPreview() {
  return (
    <section
      className="relative overflow-hidden py-20 sm:py-24"
      aria-labelledby="dashboard-preview-heading"
      style={{
        backgroundImage:
          'linear-gradient(135deg, #073b4c 0%, #0aa89a 48%, #ffb703 120%)',
      }}
    >
      <div className="landing-orb right-10 top-8 h-48 w-48 bg-white/30" aria-hidden />
      <div className="landing-orb bottom-0 left-10 h-56 w-56 bg-[color:var(--coral)]/40" aria-hidden />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center text-white">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--mango)]">
            Live clarity
          </p>
          <h2
            id="dashboard-preview-heading"
            className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Your Orders. One Clear Dashboard.
          </h2>
          <p className="mt-4 text-base text-white/85 sm:text-lg">
            Search, filter, and track every WhatsApp order — from first message to delivery.
          </p>
        </div>

        <div className="landing-perspective mt-12 px-2 sm:px-4">
          <div className="landing-3d-panel landing-float rounded-2xl">
            <DashboardMock />
          </div>
        </div>
      </div>
    </section>
  )
}
