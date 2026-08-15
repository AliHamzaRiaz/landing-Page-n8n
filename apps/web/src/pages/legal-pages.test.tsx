import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { LEGAL_CONTACT } from '@/components/legal/LegalDocumentPage'
import { DataDeletionPage } from '@/pages/DataDeletionPage'
import { TermsOfServicePage } from '@/pages/TermsOfServicePage'

describe('public legal pages', () => {
  it('renders Terms of Service without authentication', () => {
    render(
      <MemoryRouter>
        <TermsOfServicePage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Terms of Service' })).toBeInTheDocument()
    expect(screen.getByText(/WhatsApp business messaging/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Acceptable Use/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: LEGAL_CONTACT })).toHaveAttribute(
      'href',
      `mailto:${LEGAL_CONTACT}`,
    )
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument()
  })

  it('renders Data Deletion instructions without authentication', () => {
    render(
      <MemoryRouter>
        <DataDeletionPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Data Deletion' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /How to submit a deletion request/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Reasonable exceptions/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: LEGAL_CONTACT })).toHaveAttribute(
      'href',
      `mailto:${LEGAL_CONTACT}`,
    )
    expect(screen.queryByText(/META_APP_SECRET|JWT|ENCRYPTION_KEY|N8N/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument()
  })
})
