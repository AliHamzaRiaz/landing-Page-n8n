import { describe, expect, it } from 'vitest'
import { normalizePhone } from '@/lib/phone'

describe('normalizePhone', () => {
  it('strips trunk leading zero for PK numbers', () => {
    expect(normalizePhone('+92', '03134996633')).toBe('+923134996633')
  })

  it('keeps already-correct local numbers', () => {
    expect(normalizePhone('+92', '3134996633')).toBe('+923134996633')
  })

  it('does not create +920... duplicates', () => {
    expect(normalizePhone('+92', '03134996633')).not.toBe('+9203134996633')
  })
})
