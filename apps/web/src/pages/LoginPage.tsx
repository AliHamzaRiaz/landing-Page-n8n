import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { AuthShell } from '@/components/auth/AuthShell'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select } from '@/components/ui/Select'
import { COUNTRY_CODES, normalizePhone } from '@/lib/phone'

const schema = z.object({
  countryCode: z.string().min(2),
  localNumber: z.string().min(7, 'Enter a valid phone number'),
  password: z.string().min(1, 'Password is required'),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { countryCode: '+92', localNumber: '', password: '' },
  })

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in with your phone number to open your WhatsApp order dashboard."
      footer={
        <>
          New here?{' '}
          <Link
            to="/signup"
            className="font-semibold text-[color:var(--brand)] underline-offset-2 hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={handleSubmit(async (values) => {
          const phoneNumber = normalizePhone(values.countryCode, values.localNumber)
          try {
            const result = await login(phoneNumber, values.password)
            const redirect = params.get('redirect')
            if (redirect?.startsWith('/')) {
              navigate(redirect, { replace: true })
              return
            }
            navigate(result.business.onboardingCompleted ? '/dashboard' : '/onboarding', {
              replace: true,
            })
          } catch (err) {
            const verifyError = err as Error & { code?: string; phoneNumber?: string }
            if (verifyError.code === 'PHONE_NOT_VERIFIED') {
              navigate('/verify', {
                replace: true,
                state: { phoneNumber: verifyError.phoneNumber || phoneNumber },
              })
              return
            }
            setError('root', {
              message: err instanceof Error ? err.message : 'Unable to sign in.',
            })
          }
        })}
        noValidate
      >
        <div>
          <Label htmlFor="localNumber">Phone number</Label>
          <div className="mt-1.5 flex gap-2">
            <Select
              id="countryCode"
              className="w-[8.5rem] shrink-0 rounded-xl border-teal-100 bg-[color:var(--lagoon)]"
              aria-label="Country code"
              {...register('countryCode')}
            >
              {COUNTRY_CODES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </Select>
            <Input
              id="localNumber"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              className="rounded-xl border-teal-100 bg-white"
              error={Boolean(errors.localNumber)}
              {...register('localNumber')}
            />
          </div>
          {errors.localNumber ? (
            <p className="mt-1 text-xs text-danger">{errors.localNumber.message}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            className="mt-1.5 rounded-xl border-teal-100 bg-white"
            error={Boolean(errors.password)}
            {...register('password')}
          />
          {errors.password ? (
            <p className="mt-1 text-xs text-danger">{errors.password.message}</p>
          ) : null}
        </div>
        {errors.root ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-danger" role="alert">
            {errors.root.message}
          </p>
        ) : null}
        <Button
          type="submit"
          className="landing-3d-btn h-12 w-full rounded-xl bg-[linear-gradient(135deg,var(--brand),#12c4a8)]"
          loading={isSubmitting}
        >
          Sign in
        </Button>
      </form>
    </AuthShell>
  )
}
