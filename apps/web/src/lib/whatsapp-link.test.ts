import { describe, expect, it } from 'vitest'
import { toWaMeUrl } from '@/lib/whatsapp-link'

describe('toWaMeUrl', () => {
  it('builds a customer chat link from a display number', () => {
    expect(toWaMeUrl('+923134996633')).toBe('https://wa.me/923134996633')
  })

  it('returns null for invalid input', () => {
    expect(toWaMeUrl('123')).toBeNull()
    expect(toWaMeUrl(null)).toBeNull()
  })
})
