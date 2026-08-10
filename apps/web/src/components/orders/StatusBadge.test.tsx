import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusBadge } from '@/components/orders/StatusBadge'

describe('StatusBadge', () => {
  it('renders a readable status label', () => {
    render(<StatusBadge status="PROCESSING" />)
    expect(screen.getByText('Processing')).toBeInTheDocument()
  })

  it('renders DISPATCHED status', () => {
    render(<StatusBadge status="DISPATCHED" />)
    expect(screen.getByText('Dispatched')).toBeInTheDocument()
  })
})
