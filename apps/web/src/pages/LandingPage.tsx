import { Navbar } from '@/components/landing/Navbar'
import { Hero } from '@/components/landing/Hero'
import { Problem } from '@/components/landing/Problem'
import { Features } from '@/components/landing/Features'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { DashboardPreview } from '@/components/landing/DashboardPreview'
import { ShareLinks } from '@/components/landing/ShareLinks'
import { Benefits } from '@/components/landing/Benefits'
import { Trust } from '@/components/landing/Trust'
import { FAQ } from '@/components/landing/FAQ'
import { CTA } from '@/components/landing/CTA'
import { Footer } from '@/components/landing/Footer'

export function LandingPage() {
  return (
    <div id="top" className="landing-shell min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <Features />
        <HowItWorks />
        <DashboardPreview />
        <ShareLinks />
        <Benefits />
        <Trust />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
