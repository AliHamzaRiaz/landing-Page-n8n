import { Link } from 'react-router-dom'
import { LegalDocumentPage } from '@/components/legal/LegalDocumentPage'

const toc = [
  { id: 'acceptance', title: 'Acceptance of Terms' },
  { id: 'service', title: 'Description of Service' },
  { id: 'accounts', title: 'User Accounts' },
  { id: 'whatsapp', title: 'WhatsApp / Meta' },
  { id: 'acceptable-use', title: 'Acceptable Use' },
  { id: 'responsibilities', title: 'User Responsibilities' },
  { id: 'third-parties', title: 'Third-party Services' },
  { id: 'availability', title: 'Service Availability' },
  { id: 'termination', title: 'Termination' },
  { id: 'liability', title: 'Limitation of Liability' },
  { id: 'changes', title: 'Changes to Terms' },
  { id: 'contact', title: 'Contact' },
]

const sections = [
  {
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    paragraphs: [
      'These Terms of Service (“Terms”) govern access to and use of Ennitant, including the website, dashboard, APIs used by your account, and related automation features. By creating an account or using Ennitant, you agree to these Terms.',
      'If you do not agree, do not use the service. These Terms are a practical description of how Ennitant is offered. They are not legal advice and do not name a registered company, address, or license that we have not published elsewhere.',
    ],
  },
  {
    id: 'service',
    title: '2. Description of Service',
    paragraphs: [
      'Ennitant is software for businesses that receive customer messages on WhatsApp and want help turning those messages into orders they can manage in a dashboard. Features may include:',
    ],
    bullets: [
      'Account signup and a business dashboard',
      'Connecting a WhatsApp Business account through Meta’s official flows',
      'Receiving customer WhatsApp messages and routing them to the correct business',
      'AI-assisted extraction of order details from messages',
      'Creating and updating orders, including confirm and cancel actions',
      'Optional automation run on our servers (including workflow tools) to process messages',
    ],
  },
  {
    id: 'accounts',
    title: '3. User Accounts',
    paragraphs: [
      'You must provide accurate information when you register, keep your login details confidential, and notify us if you believe your account has been used without permission.',
      'Each account is associated with a business tenant. You are responsible for activity that occurs under your account, including WhatsApp messages sent using a number you connected.',
    ],
  },
  {
    id: 'whatsapp',
    title: '4. WhatsApp and Meta integrations',
    paragraphs: [
      'WhatsApp connection is provided through Meta’s official WhatsApp Business Platform (including Embedded Signup and, when Meta makes it available, Coexistence). Ennitant does not bypass Meta or WhatsApp verification and does not use unofficial WhatsApp APIs.',
      'By connecting WhatsApp you authorize Ennitant to receive webhooks and to send messages on behalf of the connected number, only as needed to operate order automation for your business. Meta and WhatsApp remain subject to their own terms and policies. You must comply with those policies, including messaging rules, opt-out expectations, and any required customer consent.',
      'Meta may change, limit, or revoke access. Ennitant is not responsible for Meta outages, policy enforcement, phone-number eligibility, App Review outcomes, or WhatsApp delivery failures.',
    ],
  },
  {
    id: 'acceptable-use',
    title: '5. Acceptable Use',
    paragraphs: ['You agree not to use Ennitant to:'],
    bullets: [
      'Send spam, scams, or unsolicited bulk messages in violation of WhatsApp or applicable law',
      'Harass, defraud, or impersonate others',
      'Attempt to access another business’s data, credentials, or orders',
      'Probe, overload, or disrupt the service except through documented product features',
      'Upload malware or attempt to reverse engineer the service in order to abuse it',
      'Use the product for any purpose that is illegal or prohibited by Meta/WhatsApp policies',
    ],
  },
  {
    id: 'responsibilities',
    title: '6. User Responsibilities',
    paragraphs: [
      'You are responsible for the products, prices, stock, and order information you maintain; for the content of messages sent from your connected WhatsApp number; and for how you handle your own customers’ orders and payments.',
      'AI-assisted automation may misread a message. You should review orders in the dashboard and correct them when needed. Ennitant does not guarantee that automated extraction or replies will be complete or accurate in every case.',
    ],
  },
  {
    id: 'third-parties',
    title: '7. Third-party Services',
    paragraphs: [
      'Ennitant depends on third parties, including Meta/WhatsApp, cloud hosting, a hosted database, and server-side automation tooling used to process messages. Those providers have their own terms. Ennitant is not a party to your separate relationship with Meta, WhatsApp, or your customers.',
    ],
  },
  {
    id: 'availability',
    title: '8. Service Availability',
    paragraphs: [
      'We aim to keep Ennitant available, but we do not promise uninterrupted service. Hosting, Meta webhooks, WhatsApp delivery, and automation workflows can fail or be delayed. Planned maintenance or unexpected downtime may occur.',
      'Features may change as we improve the product. We may add, limit, or remove capabilities when required for security, Meta policy, or operational reasons.',
    ],
  },
  {
    id: 'termination',
    title: '9. Termination',
    paragraphs: [
      'You may stop using Ennitant at any time and may disconnect WhatsApp from the dashboard. You may also request account and data deletion as described on the Data Deletion page.',
      'We may suspend or terminate access if we reasonably believe these Terms, Meta/WhatsApp policies, or applicable law have been violated, or if the service cannot continue for operational reasons. After termination, access to the dashboard may end. Historical records may be deleted as described in the Privacy Policy and Data Deletion instructions, except where limited information must be kept for security or legal purposes.',
    ],
  },
  {
    id: 'liability',
    title: '10. Limitation of Liability',
    paragraphs: [
      'Ennitant is provided as-is. To the fullest extent permitted by law, we are not liable for lost profits, lost orders, failed WhatsApp delivery, Meta policy actions, AI extraction errors, or indirect or consequential damages arising from use of the service.',
      'You remain responsible for your business operations, customer communications, and compliance with WhatsApp and Meta rules. Nothing in this section is intended to exclude liability that cannot be excluded under applicable law.',
    ],
  },
  {
    id: 'changes',
    title: '11. Changes to Terms',
    paragraphs: [
      'We may update these Terms when the product or our practices change. The “Last updated” date on this page will change when we do. Continued use of Ennitant after an update means you should review the revised Terms.',
    ],
  },
]

export function TermsOfServicePage() {
  return (
    <LegalDocumentPage
      title="Terms of Service"
      intro="These Terms describe how you may use Ennitant, a SaaS product for WhatsApp business messaging, order processing, and related automation."
      toc={toc}
      sections={sections}
      contactHeading="12. Contact"
      contactIntro="Questions about these Terms:"
    >
      <p className="mt-6 text-sm text-muted">
        See also our{' '}
        <Link to="/privacy-policy" className="rounded text-brand hover:underline focus-ring">
          Privacy Policy
        </Link>{' '}
        and{' '}
        <Link to="/data-deletion" className="rounded text-brand hover:underline focus-ring">
          Data Deletion
        </Link>{' '}
        instructions.
      </p>
    </LegalDocumentPage>
  )
}
