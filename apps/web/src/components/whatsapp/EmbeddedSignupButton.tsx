import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react'
import { Button } from '@/components/ui/Button'
import { apiGet, apiPost, getFriendlyErrorMessage } from '@/lib/api'
import {
  launchEmbeddedSignup,
  listenForEmbeddedSignupSession,
  loadFacebookSdk,
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
  const [error, setError] = useState<string | null>(null)
  const sessionRef = useRef<EmbeddedSignupSession | null>(null)
  const configRef = useRef<EmbeddedSignupConfig | null>(null)

  useEffect(() => {
    const stopListening = listenForEmbeddedSignupSession((session) => {
      sessionRef.current = session
    })
    return stopListening
  }, [])

  const connect = useCallback(async () => {
    setError(null)
    setLoading(true)
    sessionRef.current = null

    try {
      const config =
        configRef.current ??
        (await apiGet<EmbeddedSignupConfig>('/whatsapp/embedded-signup/config'))
      configRef.current = config

      await loadFacebookSdk(config.appId)

      const fbResponse = await launchEmbeddedSignup(config.configId)
      const code = fbResponse.authResponse?.code
      if (!code) {
        throw new Error('Meta did not return an authorization code')
      }

      const resolvedSession = await waitForEmbeddedSignupSession(sessionRef, 3000)

      await apiPost('/whatsapp/embedded-signup/complete', {
        code,
        wabaId: resolvedSession.wabaId,
        phoneNumberId: resolvedSession.phoneNumberId,
        displayPhoneNumber: resolvedSession.displayPhoneNumber,
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
    if (current?.wabaId && current.phoneNumberId) {
      return current
    }
    await new Promise((resolve) => setTimeout(resolve, 150))
  }
  throw new Error(
    'WhatsApp signup session details were not received from Meta. Please try again.',
  )
}
