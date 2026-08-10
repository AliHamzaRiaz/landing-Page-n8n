import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthShell } from '@/components/auth/AuthShell'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { maskPhone, pendingOtpStorage, pendingPhoneStorage } from '@/lib/phone'

const RESEND_SECONDS = 60

export function VerifyPage() {
  const { verify, resendOtp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state as { phoneNumber?: string; devCode?: string } | null) ?? null
  const phoneNumber = state?.phoneNumber || pendingPhoneStorage.get() || ''

  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(RESEND_SECONDS)
  const [devCode, setDevCode] = useState<string | null>(
    state?.devCode || pendingOtpStorage.get(),
  )
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])

  const code = useMemo(() => digits.join(''), [digits])

  useEffect(() => {
    if (!phoneNumber) {
      navigate('/signup', { replace: true })
    }
  }, [phoneNumber, navigate])

  useEffect(() => {
    inputsRef.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (countdown <= 0) return
    const id = window.setTimeout(() => setCountdown((value) => value - 1), 1000)
    return () => window.clearTimeout(id)
  }, [countdown])

  function fillCode(value: string) {
    const chars = value.replace(/\D/g, '').slice(0, 6).split('')
    const next = ['', '', '', '', '', '']
    chars.forEach((char, index) => {
      next[index] = char
    })
    setDigits(next)
    const focusIndex = Math.min(Math.max(chars.length - 1, 0), 5)
    inputsRef.current[focusIndex]?.focus()
  }

  function updateDigit(index: number, value: string) {
    const cleaned = value.replace(/\D/g, '')
    if (!cleaned) {
      setDigits((prev) => {
        const next = [...prev]
        next[index] = ''
        return next
      })
      return
    }

    if (cleaned.length > 1) {
      fillCode(cleaned)
      return
    }

    setDigits((prev) => {
      const next = [...prev]
      next[index] = cleaned
      return next
    })
    if (index < 5) inputsRef.current[index + 1]?.focus()
  }

  async function handleVerify() {
    if (code.length !== 6) {
      setError('Enter the 6-digit verification code.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const result = await verify(phoneNumber, code)
      navigate(result.business.onboardingCompleted ? '/dashboard' : '/onboarding', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to verify that code.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (countdown > 0 || !phoneNumber) return
    setResending(true)
    setError(null)
    try {
      const result = await resendOtp(phoneNumber)
      if (result.devCode) setDevCode(result.devCode)
      setCountdown(RESEND_SECONDS)
      setDigits(['', '', '', '', '', ''])
      inputsRef.current[0]?.focus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to resend the code.')
    } finally {
      setResending(false)
    }
  }

  if (!phoneNumber) return null

  return (
    <AuthShell
      title="Verify your number"
      description={`Enter the verification code sent for ${maskPhone(phoneNumber)}.`}
      footer={
        <Link
          to="/signup"
          className="font-semibold text-[color:var(--brand)] underline-offset-2 hover:underline"
        >
          Change phone number
        </Link>
      }
    >
      <div className="space-y-5">
        {devCode ? (
          <div
            className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
            role="status"
          >
            <p className="font-semibold">Development mode</p>
            <p className="mt-1">
              SMS/WhatsApp delivery is not configured yet. Your code is{' '}
              <button
                type="button"
                className="font-mono text-base font-semibold underline"
                onClick={() => fillCode(devCode)}
              >
                {devCode}
              </button>
              . Click it to autofill.
            </p>
          </div>
        ) : (
          <p className="rounded-xl border border-teal-100 bg-[color:var(--lagoon)] px-4 py-3 text-sm text-[color:var(--muted)]">
            No SMS provider is connected yet. Click <strong>Resend Code</strong>, then check the API
            terminal for a line like <code>OTP for +92…</code>.
          </p>
        )}

        <div className="flex justify-between gap-2" role="group" aria-label="Verification code">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputsRef.current[index] = el
              }}
              inputMode="numeric"
              autoComplete={index === 0 ? 'one-time-code' : 'off'}
              maxLength={6}
              value={digit}
              aria-label={`Digit ${index + 1}`}
              className="h-12 w-10 rounded-xl border border-teal-100 bg-white text-center text-lg font-bold text-[color:var(--ocean)] shadow-[0_4px_0_rgba(10,168,154,0.12)] focus-ring sm:h-14 sm:w-12"
              onChange={(event) => updateDigit(index, event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Backspace' && !digits[index] && index > 0) {
                  inputsRef.current[index - 1]?.focus()
                }
                if (event.key === 'Enter') void handleVerify()
              }}
              onPaste={(event) => {
                event.preventDefault()
                updateDigit(index, event.clipboardData.getData('text'))
              }}
            />
          ))}
        </div>

        {error ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}

        <Button
          className="landing-3d-btn h-12 w-full rounded-xl bg-[linear-gradient(135deg,var(--brand),#12c4a8)]"
          loading={loading}
          onClick={() => void handleVerify()}
        >
          Verify
        </Button>

        <div className="flex flex-col items-center gap-2 text-sm text-[color:var(--muted)]">
          <button
            type="button"
            className="font-semibold text-[color:var(--brand)] hover:underline disabled:cursor-not-allowed disabled:text-[color:var(--muted)] disabled:no-underline"
            disabled={countdown > 0 || resending}
            onClick={() => void handleResend()}
          >
            {countdown > 0 ? `Resend Code in ${countdown}s` : resending ? 'Sending…' : 'Resend Code'}
          </button>
        </div>
      </div>
    </AuthShell>
  )
}
