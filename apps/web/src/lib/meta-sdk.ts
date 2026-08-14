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
  phoneNumberId: string
  displayPhoneNumber?: string
}

const SDK_URL = 'https://connect.facebook.net/en_US/sdk.js'
const GRAPH_VERSION = 'v21.0'

let sdkPromise: Promise<void> | null = null

export function loadFacebookSdk(appId: string): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Facebook SDK requires a browser'))
  }

  if (window.FB) {
    window.FB.init({ appId, cookie: true, xfbml: false, version: GRAPH_VERSION })
    return Promise.resolve()
  }

  if (sdkPromise) return sdkPromise

  sdkPromise = new Promise((resolve, reject) => {
    window.fbAsyncInit = () => {
      window.FB?.init({ appId, cookie: true, xfbml: false, version: GRAPH_VERSION })
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

export function listenForEmbeddedSignupSession(
  onSession: (session: EmbeddedSignupSession) => void,
): () => void {
  function handler(event: MessageEvent) {
    if (
      event.origin !== 'https://www.facebook.com' &&
      event.origin !== 'https://web.facebook.com'
    ) {
      return
    }

    try {
      const payload =
        typeof event.data === 'string' ? JSON.parse(event.data) : event.data
      if (payload?.type !== 'WA_EMBEDDED_SIGNUP') return

      const data = payload.data ?? payload.payload ?? payload
      const wabaId = data.waba_id ?? data.wabaId
      const phoneNumberId = data.phone_number_id ?? data.phoneNumberId
      const displayPhoneNumber =
        data.display_phone_number ?? data.displayPhoneNumber

      if (!wabaId || !phoneNumberId) return

      onSession({
        wabaId: String(wabaId),
        phoneNumberId: String(phoneNumberId),
        displayPhoneNumber: displayPhoneNumber
          ? String(displayPhoneNumber)
          : undefined,
      })
    } catch {
      // ignore non-JSON postMessage noise
    }
  }

  window.addEventListener('message', handler)
  return () => window.removeEventListener('message', handler)
}

export function launchEmbeddedSignup(configId: string): Promise<FbLoginResponse> {
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
        extras: {
          setup: {},
          featureType: '',
          sessionInfoVersion: '3',
        },
      },
    )
  })
}
