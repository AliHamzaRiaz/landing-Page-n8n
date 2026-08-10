import { Link } from 'react-router-dom'

const columns = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'How It Works', href: '#how-it-works' },
      { label: 'Benefits', href: '#benefits' },
      { label: 'FAQ', href: '#faq' },
    ],
  },
  {
    title: 'Get started',
    links: [
      { label: 'Login', href: '/login' },
      { label: 'Get Started', href: '/signup' },
    ],
  },
]

export function Footer() {
  return (
    <footer
      className="text-teal-50"
      style={{
        backgroundImage: 'linear-gradient(160deg, #052533 0%, #073b4c 45%, #0aa89a 140%)',
      }}
    >
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <p className="font-display text-2xl font-bold text-white">Ennitant</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-teal-100/80">
            Manage your WhatsApp orders automatically — without spreadsheets or technical setup.
          </p>
        </div>
        {columns.map((column) => (
          <div key={column.title}>
            <p className="text-sm font-bold text-[color:var(--mango)]">{column.title}</p>
            <ul className="mt-4 space-y-2.5">
              {column.links.map((link) => (
                <li key={link.label}>
                  {link.href.startsWith('#') ? (
                    <a
                      href={link.href}
                      className="rounded text-sm text-teal-100/80 transition hover:text-white focus-ring"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      to={link.href}
                      className="rounded text-sm text-teal-100/80 transition hover:text-white focus-ring"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-teal-200/70 sm:px-6">
        © {new Date().getFullYear()} Ennitant. All rights reserved.
      </div>
    </footer>
  )
}
