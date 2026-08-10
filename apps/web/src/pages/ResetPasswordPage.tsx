import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { apiPost, getFriendlyErrorMessage } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm your password'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-4 py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>Choose a new password for your Ennitant account.</CardDescription>
        </CardHeader>
        <CardContent>
          {!token ? (
            <p className="text-sm text-danger" role="alert">
              Reset token is missing or invalid.{' '}
              <Link to="/forgot-password" className="font-medium text-brand hover:underline">
                Request a new link
              </Link>
            </p>
          ) : (
            <form
              className="space-y-4"
              onSubmit={handleSubmit(async (values) => {
                try {
                  await apiPost('/auth/reset-password', {
                    token,
                    password: values.password,
                  })
                  navigate('/login', { replace: true })
                } catch (err) {
                  setError('root', { message: getFriendlyErrorMessage(err) })
                }
              })}
              noValidate
            >
              <div>
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  error={Boolean(errors.password)}
                  {...register('password')}
                />
                {errors.password ? <p className="mt-1 text-xs text-danger">{errors.password.message}</p> : null}
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  error={Boolean(errors.confirmPassword)}
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword ? (
                  <p className="mt-1 text-xs text-danger">{errors.confirmPassword.message}</p>
                ) : null}
              </div>
              {errors.root ? (
                <p className="text-sm text-danger" role="alert">
                  {errors.root.message}
                </p>
              ) : null}
              <Button type="submit" className="w-full" loading={isSubmitting}>
                Update password
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
