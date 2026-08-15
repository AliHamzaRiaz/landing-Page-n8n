import { Link } from 'react-router-dom'
import { LegalDocumentPage } from '@/components/legal/LegalDocumentPage'

const toc = [
  { id: 'overview', title: 'Overview' },
  { id: 'what-is-deleted', title: 'What we delete' },
  { id: 'how-to-request', title: 'How to request deletion' },
  { id: 'after-request', title: 'After your request' },
  { id: 'exceptions', title: 'What we may retain' },
  { id: 'meta-whatsapp', title: 'WhatsApp / Meta' },
  { id: 'contact', title: 'Contact' },
]

const sections = [
  {
    id: 'overview',
    title: '1. Overview',
    paragraphs: [
      'You can ask Ennitant to delete your account and associated personal data. This page explains what that request covers, how to send it, and what happens next. It is the Data Deletion Instructions URL intended for Meta App settings and for Ennitant users.',
      'If you only want to stop WhatsApp messaging, you can disconnect WhatsApp in the dashboard without deleting the whole account. A full deletion request is for closing the Ennitant account.',
    ],
  },
  {
    id: 'what-is-deleted',
    title: '2. What data may be deleted',
    paragraphs: [
      'When we complete a verified deletion request for your Ennitant account, we delete or de-identify data tied to that account where we reasonably can, including:',
    ],
    bullets: [
      'Your login account (phone number used to sign in, name, and email if stored)',
      'Business profile information for that tenant',
      'WhatsApp connection records for that tenant, including encrypted stored credentials used to talk to Meta on your behalf',
      'Customers, orders, products, and WhatsApp message history stored for that business in Ennitant',
      'Dashboard notifications and similar in-app records for that business',
    ],
  },
  {
    id: 'how-to-request',
    title: '3. How to submit a deletion request',
    paragraphs: [
      'Email us from a mailbox you control, using the contact address on this page. To help us verify the request, include:',
    ],
    bullets: [
      'Subject line: Ennitant data deletion request',
      'The phone number registered on your Ennitant account',
      'The business name shown in your dashboard, if you remember it',
      'A short statement that you want the Ennitant account and associated personal data deleted',
    ],
  },
  {
    id: 'after-request',
    title: '4. What happens after the request',
    paragraphs: [
      'We will confirm we received the request and may ask you to verify that you control the account (for example by confirming the registered phone number). We will not delete another person’s account based on an unverified request.',
      'After verification, we will process deletion from Ennitant’s systems. We aim to complete this within 30 days. You will lose access to the dashboard. Automation for that WhatsApp number through Ennitant will stop once the connection and credentials are removed.',
      'Meta and WhatsApp may still hold copies of messages or assets in your Meta Business / WhatsApp accounts. Those copies are controlled by Meta, not by Ennitant. You may also need to remove Ennitant’s access in Meta Business settings.',
    ],
  },
  {
    id: 'exceptions',
    title: '5. Reasonable exceptions',
    paragraphs: [
      'We may retain limited information when we must, for example:',
    ],
    bullets: [
      'Records needed to detect abuse, fraud, or security incidents',
      'Information we are required to keep by law or to resolve a dispute',
      'Backups that are overwritten on a rolling schedule and are not used for ongoing processing',
    ],
  },
  {
    id: 'meta-whatsapp',
    title: '6. WhatsApp and Meta users',
    paragraphs: [
      'If you connected WhatsApp through Ennitant’s Meta app, this page is how you request that Ennitant delete data it stored after that connection. Disconnecting WhatsApp in Ennitant stops new sending and revokes stored tokens; a deletion request also removes the account records listed above.',
      'This page does not delete your independent WhatsApp or Facebook account. Use WhatsApp and Meta’s own settings for that.',
    ],
  },
]

export function DataDeletionPage() {
  return (
    <LegalDocumentPage
      title="Data Deletion"
      intro="How to request deletion of your Ennitant account and the personal data we store for that account."
      toc={toc}
      sections={sections}
      contactHeading="7. Contact"
      contactIntro="Send deletion requests to:"
    >
      <p className="mt-6 text-sm text-muted">
        See also our{' '}
        <Link to="/privacy-policy" className="rounded text-brand hover:underline focus-ring">
          Privacy Policy
        </Link>{' '}
        and{' '}
        <Link to="/terms-of-service" className="rounded text-brand hover:underline focus-ring">
          Terms of Service
        </Link>
        .
      </p>
    </LegalDocumentPage>
  )
}
