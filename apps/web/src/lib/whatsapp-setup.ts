export type WhatsAppSetupPath = 'marketplace' | 'direct'
export type WhatsAppGuideStep = 'connect' | 'webhook' | 'messages'

export const WHATSAPP_PATHS: Array<{
  id: WhatsAppSetupPath
  title: string
  subtitle: string
}> = [
  {
    id: 'marketplace',
    title: 'Marketplace for Plug&Play Solution',
    subtitle: 'Clients with no developer resources.',
  },
  {
    id: 'direct',
    title: 'Direct API Access for Developers',
    subtitle: 'Instant WhatsApp API access in minutes.',
  },
]

export const WHATSAPP_GUIDE_STEPS: Array<{
  id: WhatsAppGuideStep
  number: number
  label: string
}> = [
  { id: 'connect', number: 1, label: 'Connect' },
  { id: 'webhook', number: 2, label: 'Set webhook' },
  { id: 'messages', number: 3, label: 'Send & receive messages' },
]

export function defaultGuideStep(
  connected: boolean,
  path: WhatsAppSetupPath,
): WhatsAppGuideStep {
  if (path === 'marketplace') return 'connect'
  return connected ? 'webhook' : 'connect'
}

export function workflowSnippet(step: WhatsAppGuideStep): {
  method: string
  endpoint: string
  blurb: string
  code: string
} {
  if (step === 'connect') {
    return {
      method: 'META',
      endpoint: 'Embedded Signup',
      blurb: 'Connect your WhatsApp Business number with Meta. Keep this window open until signup finishes.',
      code: [
        '# Connect WhatsApp (no API key to paste)',
        '',
        '1. Click Connect WhatsApp',
        '2. Complete Meta Embedded Signup',
        '3. If Meta shows a QR, scan it in WhatsApp Business',
        '4. Ennitant stores this number for your shop only',
      ].join('\n'),
    }
  }

  if (step === 'webhook') {
    return {
      method: 'POST',
      endpoint: '/api/webhooks/whatsapp',
      blurb:
        'A webhook is how Ennitant receives incoming messages and status updates from WhatsApp. You do not host this URL yourself.',
      code: [
        'curl -X POST /api/webhooks/whatsapp \\',
        "  -H 'Content-Type: application/json' \\",
        "  -d '{",
        '    "object": "whatsapp_business_account",',
        '    "entry": [{',
        '      "changes": [{',
        '        "field": "messages",',
        '        "value": {',
        '          "messaging_product": "whatsapp",',
        '          "messages": [{',
        '            "from": "CUSTOMER_PHONE",',
        '            "type": "text",',
        '            "text": { "body": "I want to order..." }',
        '          }]',
        '        }',
        '      }]',
        '    }]',
        "  }'",
      ].join('\n'),
    }
  }

  return {
    method: 'POST',
    endpoint: 'graph.facebook.com/{phone-number-id}/messages',
    blurb: 'Send and receive on your connected number. Replies go out through Meta Cloud API using this shop’s WhatsApp account.',
    code: [
      'curl -X POST \\',
      '  https://graph.facebook.com/v21.0/{phone-number-id}/messages \\',
      "  -H 'Authorization: Bearer ••••••••' \\",
      "  -H 'Content-Type: application/json' \\",
      "  -d '{",
      '    "messaging_product": "whatsapp",',
      '    "to": "CUSTOMER_PHONE",',
      '    "type": "text",',
      '    "text": { "body": "Order received" }',
      "  }'",
    ].join('\n'),
  }
}
