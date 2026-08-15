export type FbLoginResponse = {
  authResponse?: {
    code?: string
    accessToken?: string
    userID?: string
  }
  status?: string
}

export type EmbeddedSignupSession = {
  wabaId: string
  phoneNumberId?: string
  displayPhoneNumber?: string
  event?: string
}

export type EmbeddedSignupEvent =
  | { kind: 'session'; session: EmbeddedSignupSession }
  | { kind: 'cancel'; message?: string }
  | { kind: 'error'; message: string; coexistenceUnavailable?: boolean }

declare global {
  interface Window {
    FB?: {
      init: (params: {
        appId: string
        cookie?: boolean
        xfbml?: boolean
        version: string
      }) => void
      login: (
        callback: (response: FbLoginResponse) => void,
        options?: Record<string, unknown>,
      ) => void
    }
    fbAsyncInit?: () => void
  }
}

const SDK_URL = 'https://connect.facebook.net/en_US/sdk.js'

let sdkPromise: Promise<void> | null = null

function graphVersion(): string {
  return 'v21.0'
}

export function loadFacebookSdk(appId: string): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Facebook SDK requires a browser'))
  }

  if (window.FB) {
    window.FB.init({
      appId,
      cookie: true,
      xfbml: false,
      version: graphVersion(),
    })
    return Promise.resolve()
  }

  if (sdkPromise) return sdkPromise

  sdkPromise = new Promise((resolve, reject) => {
    window.fbAsyncInit = () => {
      window.FB?.init({
        appId,
        cookie: true,
        xfbml: false,
        version: graphVersion(),
      })
      resolve()
    }

    const existing = document.getElementById('facebook-jssdk')
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Failed to load Facebook SDK')), {
        once: true,
      })
      return
    }

    const script = document.createElement('script')
    script.id = 'facebook-jssdk'
    script.async = true
    script.defer = true
    script.src = SDK_URL
    script.onerror = () => reject(new Error('Failed to load Facebook SDK'))
    document.body.appendChild(script)
  })

  return sdkPromise
}

function parseEmbeddedMessage(event: MessageEvent): EmbeddedSignupEvent | null {
  if (event.origin !== 'https://www.facebook.com' && event.origin !== 'https://web.facebook.com') {
    return null
  }

  try {
    const payload = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
    if (payload?.type !== 'WA_EMBEDDED_SIGNUP') return null

    const eventName = String(payload.event ?? payload.data?.event ?? '')
    const data = payload.data ?? payload.payload ?? {}
    const errorMessage = String(
      data.error_message ?? data.errorMessage ?? data.current_step ?? payload.error_message ?? '',
    )
    const lower = `${eventName} ${errorMessage}`.toLowerCase()
    const coexistenceUnavailable =
      lower.includes('coexist') ||
      lower.includes('whatsapp_business_app_onboarding') && lower.includes('not')

    if (eventName === 'CANCEL') {
      return { kind: 'cancel', message: errorMessage || 'WhatsApp connection was cancelled' }
    }
    if (eventName === 'ERROR') {
      return {
        kind: 'error',
        message: errorMessage || 'Meta could not complete WhatsApp onboarding.',
        coexistenceUnavailable,
      }
    }

    const wabaId = data.waba_id ?? data.wabaId
    const phoneNumberId = data.phone_number_id ?? data.phoneNumberId
    const displayPhoneNumber = data.display_phone_number ?? data.displayPhoneNumber
    if (!wabaId) return null

    return {
      kind: 'session',
      session: {
        wabaId: String(wabaId),
        phoneNumberId: phoneNumberId ? String(phoneNumberId) : undefined,
        displayPhoneNumber: displayPhoneNumber ? String(displayPhoneNumber) : undefined,
        event: eventName,
      },
    }
  } catch {
    return null
  }
}

export function listenForEmbeddedSignupEvents(
  onEvent: (event: EmbeddedSignupEvent) => void,
): () => void {
  function handler(event: MessageEvent) {
    const parsed = parseEmbeddedMessage(event)
    if (parsed) onEvent(parsed)
  }
  window.addEventListener('message', handler)
  return () => window.removeEventListener('message', handler)
}

export function launchEmbeddedSignup(
  configId: string,
  path: 'standard' | 'coexistence',
): Promise<FbLoginResponse> {
  return new Promise((resolve, reject) => {
    if (!window.FB) {
      reject(new Error('Facebook SDK not loaded'))
      return
    }

    window.FB.login(
      (response) => {
        if (response.authResponse?.code) {
          resolve(response)
          return
        }
        if (response.status === 'unknown') {
          reject(new Error('WhatsApp connection was cancelled'))
          return
        }
        reject(new Error('Meta did not return an authorization code'))
      },
      {
        config_id: configId,
        response_type: 'code',
        override_default_response_type: true,
        extras:
          path === 'coexistence'
            ? {
                setup: {},
                featureType: 'whatsapp_business_app_onboarding',
                sessionInfoVersion: '3',
              }
            : {
                setup: {},
                sessionInfoVersion: '3',
              },
      },
    )
  })
}

export function isCoexistenceFinish(event?: string): boolean {
  return event === 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING'
}
