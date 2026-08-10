import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { AuthShell } from '@/components/auth/AuthShell'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select } from '@/components/ui/Select'
import { COUNTRY_CODES, normalizePhone } from '@/lib/phone'

const schema = z
  .object({
    countryCode: z.string().min(2),
    localNumber: z.string().min(7, 'Enter a valid phone number'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm your password'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

export function SignupPage() {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      countryCode: '+92',
      localNumber: '',
      password: '',
      confirmPassword: '',
    },
  })

  return (
    <AuthShell
      title="Create your account"
      description="Use your phone number to start managing WhatsApp orders in minutes."
      footer={
        <>
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-[color:var(--brand)] underline-offset-2 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={handleSubmit(async (values) => {
          try {
            const phoneNumber = normalizePhone(values.countryCode, values.localNumber)
            const result = await registerUser({
              phoneNumber,
              password: values.password,
              confirmPassword: values.confirmPassword,
            })
            navigate('/verify', {
              replace: true,
              state: { phoneNumber, devCode: result.devCode },
            })
          } catch (err) {
            setError('root', {
              message: err instanceof Error ? err.message : 'Unable to create account.',
            })
          }
        })}
        noValidate
      >
        <div>
          <Label htmlFor="localNumber">Phone / Mobile Number</Label>
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
              placeholder="3XX XXXXXXX"
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
            autoComplete="new-password"
            className="mt-1.5 rounded-xl border-teal-100 bg-white"
            error={Boolean(errors.password)}
            {...register('password')}
          />
          {errors.password ? (
            <p className="mt-1 text-xs text-danger">{errors.password.message}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            className="mt-1.5 rounded-xl border-teal-100 bg-white"
            error={Boolean(errors.confirmPassword)}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword ? (
            <p className="mt-1 text-xs text-danger">{errors.confirmPassword.message}</p>
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
          Create Account
        </Button>
      </form>
    </AuthShell>
  )
}
