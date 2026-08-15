import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { WhatsAppSetupHub } from '@/components/whatsapp/WhatsAppSetupHub'
import type { WhatsAppStatus } from '@/types'

vi.mock('@/components/whatsapp/EmbeddedSignupButton', () => ({
  EmbeddedSignupButton: ({ children }: { children?: string }) => (
    <button type="button">{children ?? 'Connect WhatsApp'}</button>
  ),
}))

describe('WhatsAppSetupHub', () => {
  it('matches the Direct API workflow UI and switches to Plug&Play', async () => {
    const user = userEvent.setup()
    const status: WhatsAppStatus = {
      status: 'CONNECTED',
      phoneNumber: '+923001234567',
      displayName: 'Demo Shop',
    }

    render(
      <MemoryRouter>
        <WhatsAppSetupHub
          status={status}
          chatUrl="https://wa.me/923001234567"
          phone="+923001234567"
          onConnected={vi.fn()}
          onTest={vi.fn()}
          onDisconnect={vi.fn()}
        />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: /What kind of WhatsApp solution do you need/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Direct API Access' })).toBeInTheDocument()
    expect(screen.getByText(/Webhook live for this number/i)).toBeInTheDocument()
    expect(screen.getAllByText(/\/api\/webhooks\/whatsapp/i).length).toBeGreaterThan(0)

    await user.click(screen.getByRole('tab', { name: /Connect/i }))
    expect(screen.getByRole('button', { name: /Keep this number/i })).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: /Send & receive messages/i }))
    expect(screen.getByRole('button', { name: /Send test/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Marketplace for Plug&Play Solution/i }))
    expect(screen.getByRole('heading', { name: 'Plug&Play' })).toBeInTheDocument()
  })
})
