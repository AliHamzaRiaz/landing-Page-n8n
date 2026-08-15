import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { apiPost, getFriendlyErrorMessage } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import type { OnboardingResult } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { EmbeddedSignupButton } from '@/components/whatsapp/EmbeddedSignupButton'
import { CheckCircle2 } from 'lucide-react'

type Step = 'business' | 'otp' | 'whatsapp' | 'success'

export function OnboardingPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, business, setBusiness, refreshMe } = useAuth()
  const [step, setStep] = useState<Step>('business')
  const [companyName, setCompanyName] = useState(business?.companyName || business?.name || '')
  const [whatsappNumber, setWhatsappNumber] = useState(
    business?.whatsappNumber || user?.phoneNumber || '',
  )
  const [useDifferentNumber, setUseDifferentNumber] = useState(false)
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const displayWhatsApp = useMemo(
    () => (useDifferentNumber ? whatsappNumber : user?.phoneNumber || whatsappNumber),
    [useDifferentNumber, whatsappNumber, user?.phoneNumber],
  )

  async function handleContinue() {
    setError(null)
    if (companyName.trim().length < 2) {
      setError('Enter your business name.')
      return
    }
    setLoading(true)
    try {
      const result = await apiPost<OnboardingResult>('/businesses/onboarding', {
        companyName: companyName.trim(),
        whatsappNumber: displayWhatsApp.trim(),
      })
      setBusiness(result)
      if (result.requiresWhatsAppOtp) {
        setStep('otp')
      } else {
        setStep('whatsapp')
      }
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Unable to save your business details.'))
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirmWhatsApp() {
    setError(null)
    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the 6-digit verification code.')
      return
    }
    setLoading(true)
    try {
      const result = await apiPost<OnboardingResult>('/businesses/whatsapp/confirm', {
        whatsappNumber: displayWhatsApp.trim(),
        code: otp,
      })
      setBusiness(result)
      setStep('whatsapp')
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Unable to verify your WhatsApp number.'))
    } finally {
      setLoading(false)
    }
  }

  async function handleWhatsAppConnected() {
    await refreshMe()
    void queryClient.invalidateQueries({ queryKey: ['whatsapp-status'] })
    setStep('success')
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 py-10">
      <div className="mb-8 text-center">
        <p className="font-display text-3xl font-semibold text-brand">Ennitant</p>
      </div>

      <Card className="animate-slide-up">
        {step === 'business' ? (
          <>
            <CardHeader>
              <CardTitle className="text-xl">Tell Us About Your Business</CardTitle>
              <CardDescription>
                Enter your business name to get started. You&apos;ll connect WhatsApp next.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="companyName">Company / Business Name</Label>
                <Input
                  id="companyName"
                  placeholder="Enter your business name"
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="whatsappNumber">Business WhatsApp Number</Label>
                <Input
                  id="whatsappNumber"
                  type="tel"
                  value={displayWhatsApp}
                  disabled={!useDifferentNumber}
                  onChange={(event) => setWhatsappNumber(event.target.value)}
                />
                <button
                  type="button"
                  className="mt-2 text-sm font-medium text-brand hover:underline"
                  onClick={() => {
                    setUseDifferentNumber((value) => !value)
                    if (!useDifferentNumber) {
                      setWhatsappNumber(user?.phoneNumber || '')
                    }
                  }}
                >
                  {useDifferentNumber ? 'Use my signup number' : 'Use a different number'}
                </button>
                <p className="mt-2 text-xs text-muted">
                  If you use a different number we&apos;ll verify it before WhatsApp connection.
                </p>
              </div>
              {error ? (
                <p className="text-sm text-danger" role="alert">
                  {error}
                </p>
              ) : null}
              <Button className="w-full" loading={loading} onClick={() => void handleContinue()}>
                Continue
              </Button>
            </CardContent>
          </>
        ) : null}

        {step === 'otp' ? (
          <>
            <CardHeader>
              <CardTitle className="text-xl">Verify WhatsApp Number</CardTitle>
              <CardDescription>
                Enter the code we sent to {displayWhatsApp}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="wa-otp">Verification code</Label>
                <Input
                  id="wa-otp"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit code"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                />
              </div>
              {error ? (
                <p className="text-sm text-danger" role="alert">
                  {error}
                </p>
              ) : null}
              <Button className="w-full" loading={loading} onClick={() => void handleConfirmWhatsApp()}>
                Verify WhatsApp
              </Button>
            </CardContent>
          </>
        ) : null}

        {step === 'whatsapp' ? (
          <>
            <CardHeader>
              <CardTitle className="text-xl">Connect your WhatsApp</CardTitle>
              <CardDescription>
                Link your WhatsApp Business Account through Meta. If the number already uses the
                WhatsApp Business app, Meta may show its official QR for you to scan. Keep this
                window open until Meta finishes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <EmbeddedSignupButton onConnected={() => void handleWhatsAppConnected()} />
              {error ? (
                <p className="text-sm text-danger" role="alert">
                  {error}
                </p>
              ) : null}
            </CardContent>
          </>
        ) : null}

        {step === 'success' ? (
          <>
            <CardHeader>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-success" aria-hidden />
                <div>
                  <CardTitle className="text-xl">WhatsApp connected successfully</CardTitle>
                  <CardDescription>You&apos;re ready to manage orders from your dashboard.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => navigate('/dashboard', { replace: true })}>
                Continue to Dashboard
              </Button>
            </CardContent>
          </>
        ) : null}
      </Card>
    </div>
  )
}
