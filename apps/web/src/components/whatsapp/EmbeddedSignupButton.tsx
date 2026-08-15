import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react'
import { Button } from '@/components/ui/Button'
import { apiGet, apiPost, getFriendlyErrorMessage } from '@/lib/api'
import {
  isCoexistenceFinish,
  launchEmbeddedSignup,
  listenForEmbeddedSignupEvents,
  loadFacebookSdk,
  type EmbeddedSignupEvent,
  type EmbeddedSignupSession,
} from '@/lib/meta-sdk'

type EmbeddedSignupConfig = {
  appId: string
  configId: string
}

export function EmbeddedSignupButton({
  onConnected,
  disabled,
  className,
}: {
  onConnected?: () => void
  disabled?: boolean
  className?: string
}) {
  const [loading, setLoading] = useState(false)
  const [hint, setHint] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const sessionRef = useRef<EmbeddedSignupSession | null>(null)
  const lastEventRef = useRef<EmbeddedSignupEvent | null>(null)
  const configRef = useRef<EmbeddedSignupConfig | null>(null)

  useEffect(() => {
    return listenForEmbeddedSignupEvents((event) => {
      lastEventRef.current = event
      if (event.kind === 'session') {
        sessionRef.current = event.session
      }
    })
  }, [])

  const connect = useCallback(async () => {
    setError(null)
    setHint(
      'Keep this window open. If Meta asks you to scan a QR, use the WhatsApp Business app. That QR is Meta’s official onboarding QR — not your customer chat QR.',
    )
    setLoading(true)
    sessionRef.current = null

    try {
      const config =
        configRef.current ??
        (await apiGet<EmbeddedSignupConfig>('/whatsapp/embedded-signup/config'))
      configRef.current = config

      await loadFacebookSdk(config.appId)

      let code: string | undefined
      let usedCoexistence = true

      try {
        const fbResponse = await launchEmbeddedSignup(config.configId, 'coexistence')
        code = fbResponse.authResponse?.code
      } catch (coexistError) {
        const lastEvent = lastEventRef.current
        const shouldFallback =
          lastEvent?.kind === 'error' && Boolean(lastEvent.coexistenceUnavailable)
        if (!shouldFallback) {
          throw coexistError
        }
        usedCoexistence = false
        setHint('This number is not eligible for WhatsApp Business App Coexistence. Continuing with standard Meta verification.')
        sessionRef.current = null
        const fbResponse = await launchEmbeddedSignup(config.configId, 'standard')
        code = fbResponse.authResponse?.code
      }

      if (!code) {
        throw new Error('Meta did not return an authorization code')
      }

      const session = await waitForEmbeddedSignupSession(sessionRef, 8000)
      const onboardingPath =
        usedCoexistence && isCoexistenceFinish(session.event)
          ? 'coexistence'
          : usedCoexistence && !session.phoneNumberId
            ? 'coexistence'
            : 'embedded_signup'

      await apiPost('/whatsapp/embedded-signup/complete', {
        code,
        wabaId: session.wabaId,
        phoneNumberId: session.phoneNumberId,
        displayPhoneNumber: session.displayPhoneNumber,
        onboardingPath,
      })

      onConnected?.()
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Unable to connect WhatsApp.'))
    } finally {
      setLoading(false)
    }
  }, [onConnected])

  return (
    <div className={className}>
      <Button
        type="button"
        className="w-full sm:w-auto"
        loading={loading}
        disabled={disabled || loading}
        onClick={() => void connect()}
      >
        Connect WhatsApp
      </Button>
      {hint && !error ? (
        <p className="mt-3 text-sm text-muted" role="status">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="mt-2 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

async function waitForEmbeddedSignupSession(
  sessionRef: MutableRefObject<EmbeddedSignupSession | null>,
  timeoutMs: number,
): Promise<EmbeddedSignupSession> {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    const current = sessionRef.current
    if (current?.wabaId) {
      return current
    }
    await new Promise((resolve) => setTimeout(resolve, 150))
  }
  throw new Error(
    'WhatsApp signup session details were not received from Meta. Please try again.',
  )
}
