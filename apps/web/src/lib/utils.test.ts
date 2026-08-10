import { describe, expect, it } from 'vitest'
import { cn, formatOrderStatus, statusTone } from '@/lib/utils'

describe('cn', () => {
  it('merges class names and resolves Tailwind conflicts', () => {
    expect(cn('px-2 py-1', 'px-4', false && 'hidden', 'text-sm')).toBe('py-1 px-4 text-sm')
  })
})

describe('formatOrderStatus', () => {
  it('formats known statuses', () => {
    expect(formatOrderStatus('PENDING')).toBe('Pending')
    expect(formatOrderStatus('DISPATCHED')).toBe('Dispatched')
    expect(formatOrderStatus('DELIVERED')).toBe('Delivered')
  })

  it('formats unknown statuses into title case', () => {
    expect(formatOrderStatus('CUSTOM_STATE')).toBe('Custom State')
  })
})

describe('statusTone', () => {
  it('maps statuses to visual tones', () => {
    expect(statusTone('PENDING')).toBe('warning')
    expect(statusTone('DISPATCHED')).toBe('info')
    expect(statusTone('DELIVERED')).toBe('success')
    expect(statusTone('CANCELLED')).toBe('danger')
  })
})
