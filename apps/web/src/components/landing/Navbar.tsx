import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const links = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Benefits', href: '#benefits' },
  { label: 'FAQ', href: '#faq' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b transition-all duration-300',
        scrolled
          ? 'border-[color:var(--border)] bg-white/85 backdrop-blur-xl shadow-sm shadow-teal-900/5'
          : 'border-transparent bg-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a
          href="#top"
          className="font-display text-xl font-bold tracking-tight focus-ring sm:text-2xl"
          style={{
            backgroundImage: 'linear-gradient(120deg, var(--ocean), var(--brand) 55%, #16c2b0)',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
          }}
        >
          Ennitant
        </a>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-xl px-3 py-2 text-sm font-medium text-[color:var(--muted)] transition hover:bg-[color:var(--lagoon)] hover:text-[color:var(--ocean)] focus-ring"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
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

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[color:var(--border)] bg-white text-[color:var(--ocean)] focus-ring md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="relative block h-3.5 w-5">
            <span
              className={cn(
                'absolute left-0 h-0.5 w-5 bg-[color:var(--ocean)] transition',
                open ? 'top-1.5 rotate-45' : 'top-0',
              )}
            />
            <span
              className={cn(
                'absolute left-0 top-1.5 h-0.5 w-5 bg-[color:var(--ocean)] transition',
                open ? 'opacity-0' : 'opacity-100',
              )}
            />
            <span
              className={cn(
                'absolute left-0 h-0.5 w-5 bg-[color:var(--ocean)] transition',
                open ? 'top-1.5 -rotate-45' : 'top-3',
              )}
            />
          </span>
        </button>
      </div>

      <div
        id="mobile-nav"
        className={cn('border-t border-[color:var(--border)] bg-white/95 md:hidden', open ? 'block' : 'hidden')}
      >
        <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4" aria-label="Mobile">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-xl px-3 py-3 text-base font-medium text-[color:var(--ocean)] hover:bg-[color:var(--lagoon)] focus-ring"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="mt-3 grid gap-2 border-t border-[color:var(--border)] pt-4">
            <Link to="/login" onClick={() => setOpen(false)}>
              <Button variant="outline" className="h-12 w-full rounded-xl" size="lg">
                Login
              </Button>
            </Link>
            <Link to="/signup" onClick={() => setOpen(false)}>
              <Button
                className="h-12 w-full rounded-xl bg-[linear-gradient(135deg,var(--brand),#12c4a8)]"
                size="lg"
              >
                Get Started
              </Button>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
}
