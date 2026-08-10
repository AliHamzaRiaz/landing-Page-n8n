import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { apiPost, getFriendlyErrorMessage } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
})

type FormValues = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const [done, setDone] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-4 py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Forgot password</CardTitle>
          <CardDescription>
            Enter your email and we’ll send reset instructions if an account exists.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {done ? (
            <div className="space-y-4">
              <p className="text-sm text-success" role="status">
                If that email is registered, reset instructions are on the way.
              </p>
              <Link to="/login" className="text-sm font-medium text-brand hover:underline">
                Back to login
              </Link>
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={handleSubmit(async (values) => {
                try {
                  await apiPost('/auth/forgot-password', values)
                  setDone(true)
                } catch (err) {
                  setError('root', { message: getFriendlyErrorMessage(err) })
                }
              })}
              noValidate
            >
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" error={Boolean(errors.email)} {...register('email')} />
                {errors.email ? <p className="mt-1 text-xs text-danger">{errors.email.message}</p> : null}
              </div>
              {errors.root ? (
                <p className="text-sm text-danger" role="alert">
                  {errors.root.message}
                </p>
              ) : null}
              <Button type="submit" className="w-full" loading={isSubmitting}>
                Send reset link
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
