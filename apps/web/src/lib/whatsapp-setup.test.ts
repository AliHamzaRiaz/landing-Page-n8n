import { describe, expect, it } from 'vitest'
import { defaultGuideStep, workflowSnippet } from '@/lib/whatsapp-setup'

describe('defaultGuideStep', () => {
  it('opens connect on the Plug&Play path', () => {
    expect(defaultGuideStep(false, 'marketplace')).toBe('connect')
    expect(defaultGuideStep(true, 'marketplace')).toBe('connect')
  })

  it('opens webhook on Direct API after the number is connected', () => {
    expect(defaultGuideStep(false, 'direct')).toBe('connect')
    expect(defaultGuideStep(true, 'direct')).toBe('webhook')
  })
})

describe('workflowSnippet', () => {
  it('does not include secrets or third-party API keys', () => {
    const combined = (['connect', 'webhook', 'messages'] as const)
      .map((step) => workflowSnippet(step).code)
      .join('\n')
    expect(combined).not.toMatch(/META_APP_SECRET|ENCRYPTION_KEY|JWT|D360-API-KEY|N8N_|360dialog/i)
    expect(combined).toContain('CUSTOMER_PHONE')
    expect(workflowSnippet('webhook').method).toBe('POST')
  })
})
