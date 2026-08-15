import { Link } from 'react-router-dom'
import { Footer } from '@/components/landing/Footer'
import { Button } from '@/components/ui/Button'

const UPDATED = '15 August 2026'

const PRIVACY_CONTACT = 'hamzagujjarriaz3@gmail.com'

const toc = [
  { id: 'who-we-are', title: 'Who we are' },
  { id: 'account-information', title: 'Account information' },
  { id: 'business-information', title: 'Business information' },
  { id: 'whatsapp-meta', title: 'WhatsApp / Meta data' },
  { id: 'customer-orders', title: 'Customers and orders' },
  { id: 'authentication', title: 'Authentication' },
  { id: 'how-we-use', title: 'How we use data' },
  { id: 'storage-security', title: 'Storage and security' },
  { id: 'third-parties', title: 'Third parties' },
  { id: 'retention', title: 'Retention' },
  { id: 'your-rights', title: 'Your rights' },
  { id: 'contact', title: 'Contact' },
]

const policySections: Array<{
  id: string
  title: string
  paragraphs: string[]
  bullets?: string[]
}> = [
  {
    id: 'who-we-are',
    title: '1. Who we are',
    paragraphs: [
      'Ennitant provides software that helps business owners connect a WhatsApp Business account, receive customer messages, extract order details, and manage those orders in a dashboard.',
      'This Privacy Policy describes information handled by Ennitant. Meta and WhatsApp process messaging data under their own policies when you use WhatsApp or complete Meta Embedded Signup.',
    ],
  },
  {
    id: 'account-information',
    title: '2. Account information',
    paragraphs: [
      'When you sign up, we collect information needed to create and secure your account.',
    ],
    bullets: [
      'Phone number used to register and sign in',
      'Password (stored as a one-way hash; we cannot read your password)',
      'Optional name and email if you provide them',
      'Verification codes sent during signup or WhatsApp number confirmation',
    ],
  },
  {
    id: 'business-information',
    title: '3. Business information',
    paragraphs: [
      'We store business profile details so orders, products, and WhatsApp connections belong to the correct tenant.',
    ],
    bullets: [
      'Business or company name and public slug',
      'Business WhatsApp display number after you connect or during onboarding',
      'Optional contact details such as address, timezone, currency, and industry',
    ],
  },
  {
    id: 'whatsapp-meta',
    title: '4. WhatsApp and Meta integration data',
    paragraphs: [
      'If you click Connect WhatsApp, you authorize Ennitant through Meta’s official Embedded Signup (or Coexistence, if Meta offers it for your number). WhatsApp and Meta data is used only to provide the connected automation and integration services you requested — routing inbound messages, sending order-related replies, and keeping your WhatsApp connection working.',
      'We do not use connected WhatsApp conversations for advertising. We do not sell this information. We do not ask you to paste Meta App secrets or access tokens into the product.',
    ],
    bullets: [
      'WhatsApp Business Account ID (WABA ID) and phone number ID assigned by Meta',
      'Display phone number and connection status',
      'A Meta access token stored encrypted on our servers so we can send messages and manage the connection on your behalf',
      'Inbound and outbound WhatsApp message content needed to process orders and keep a message history for your business',
      'Technical webhook metadata such as WhatsApp message IDs, used for delivery and duplicate protection',
    ],
  },
  {
    id: 'customer-orders',
    title: '5. Customer and order information',
    paragraphs: [
      'When a customer messages a connected business WhatsApp number, we store information required to create and update orders in that business’s account only.',
    ],
    bullets: [
      'Customer WhatsApp phone number and optional name',
      'Order details such as items, quantities, prices, status, notes, and delivery address when provided',
      'Status changes (for example confirmed or cancelled), including those from WhatsApp buttons',
    ],
  },
  {
    id: 'authentication',
    title: '6. Authentication information',
    paragraphs: [
      'After you sign in, we use a session token stored in your browser so the dashboard can identify your account and tenant. That token is bound to your user and business. Other businesses cannot use it to access your data.',
      'Service-to-service automation (including order extraction) uses a separate server-side shared secret. That secret is not exposed in the frontend and is not part of your login session.',
    ],
  },
  {
    id: 'how-we-use',
    title: '7. How we use information',
    paragraphs: ['We use collected information to:'],
    bullets: [
      'Create and authenticate accounts, and isolate each business’s data',
      'Connect and maintain your WhatsApp Business integration via Meta',
      'Receive customer WhatsApp messages, route them to the correct business, and process order intent',
      'Create, update, and display orders, customers, products, and dashboard activity',
      'Send WhatsApp replies related to orders using your connected number',
      'Diagnose connection issues, prevent abuse, and improve reliability of the service',
    ],
  },
  {
    id: 'storage-security',
    title: '8. Data storage and security',
    paragraphs: [
      'Account, business, order, and WhatsApp connection records are stored in a hosted PostgreSQL database. The web application and API are hosted by our cloud providers.',
      'Meta access tokens are encrypted before they are saved. Secrets such as Meta App Secret, encryption keys, and automation webhook secrets are kept on the server and are not sent to the browser.',
      'We use HTTPS in production, JWT-protected account APIs, and tenant checks so one business cannot read another business’s orders, customers, or WhatsApp credentials. No security measure is perfect; we work to protect data but cannot guarantee that unauthorized access will never occur.',
    ],
  },
  {
    id: 'third-parties',
    title: '9. Third-party services',
    paragraphs: [
      'Ennitant relies on third parties to operate. They process data only as needed to provide their services to us.',
    ],
    bullets: [
      'Meta / WhatsApp Business Platform — authentication (Embedded Signup), WhatsApp messaging, and webhooks',
      'Cloud hosting and database providers — running the website, API, and data storage',
      'Automation workflow tooling used on our servers to help extract order details from messages',
    ],
  },
  {
    id: 'retention',
    title: '10. Data retention',
    paragraphs: [
      'We keep account, business, WhatsApp connection, customer, and order records for as long as the business account remains active so the dashboard and automation continue to work.',
      'If you disconnect WhatsApp, we stop sending through that connection and revoke stored tokens. Historical messages and orders already created for your business remain unless you request deletion of the account.',
      'If you ask us to delete your account, we will delete or de-identify associated records from our systems except where we must retain limited information for security, dispute, or legal reasons.',
    ],
  },
  {
    id: 'your-rights',
    title: '11. Your rights',
    paragraphs: [
      'Depending on where you live, you may have rights to request access, correction, or deletion of personal information we hold about you, or to object to certain processing. Business owners can view and update much of their account, business, product, customer, and order data in the Ennitant dashboard.',
      'To make a privacy request, use the contact email below. We may need to verify that the request comes from the account owner. This policy is not legal advice and does not claim specific certifications (such as ISO or SOC) or laws (such as GDPR or CCPA) unless we later implement and document those programs.',
    ],
  },
  {
    id: 'children',
    title: '12. Children',
    paragraphs: [
      'Ennitant is intended for business users. We do not knowingly collect personal information from children.',
    ],
  },
  {
    id: 'changes',
    title: '13. Changes to this policy',
    paragraphs: [
      'We may update this Privacy Policy when the product or our practices change. The “Last updated” date at the top of this page will change when we do. Continued use of Ennitant after an update means you should review the revised policy.',
    ],
  },
]

export function PrivacyPolicyPage() {
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
        <h1 className="mt-2 font-display text-4xl font-semibold text-ink">Privacy Policy</h1>
        <p className="mt-3 text-sm text-muted">Last updated: {UPDATED}</p>
        <p className="mt-6 text-base leading-relaxed text-ink">
          This page explains what Ennitant collects, why we collect it, and how that information is
          used to operate WhatsApp order automation for connected businesses.
        </p>

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
          {policySections.map((section) => (
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
            <h2 className="font-display text-xl font-semibold text-ink">14. Contact</h2>
            <p className="mt-3 text-muted">
              For privacy questions, access requests, or deletion requests, contact:
            </p>
            <p className="mt-2 font-medium text-ink">
              <a href={`mailto:${PRIVACY_CONTACT}`} className="text-brand hover:underline focus-ring rounded">
                {PRIVACY_CONTACT}
              </a>
            </p>
          </section>
        </article>
      </main>

      <Footer />
    </div>
  )
}
