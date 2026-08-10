import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { apiGet, apiPatch, getFriendlyErrorMessage } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import type { Business } from '@/types'

const schema = z.object({
  name: z.string().min(2, 'Business name is required'),
  phone: z.string().optional(),
  email: z
    .string()
    .optional()
    .refine((value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
      message: 'Enter a valid email',
    }),
  address: z.string().optional(),
  timezone: z.string().optional(),
  currency: z.string().min(3).max(3),
})

type FormValues = z.infer<typeof schema>

export function SettingsPage() {
  const { setBusiness } = useAuth()
  const queryClient = useQueryClient()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['business-me'],
    queryFn: () => apiGet<Business>('/businesses/me'),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      address: '',
      timezone: '',
      currency: 'USD',
    },
  })

  useEffect(() => {
    if (data) {
      reset({
        name: data.companyName || data.name || '',
        phone: data.phone || data.whatsappNumber || '',
        email: data.email ?? '',
        address: data.address ?? '',
        timezone: data.timezone ?? '',
        currency: data.currency ?? 'USD',
      })
    }
  }, [data, reset])

  const mutation = useMutation({
    mutationFn: (values: FormValues) => apiPatch<Business>('/businesses/me', values),
    onSuccess: (business) => {
      setBusiness(business)
      queryClient.setQueryData(['business-me'], business)
      reset({
        name: business.companyName || business.name || '',
        phone: business.phone || business.whatsappNumber || '',
        email: business.email ?? '',
        address: business.address ?? '',
        timezone: business.timezone ?? '',
        currency: business.currency ?? 'USD',
      })
      void queryClient.invalidateQueries({ queryKey: ['business-me'] })
    },
  })

  return (
    <AppShell title="Settings">
      <div className="mb-5 app-panel max-w-2xl rounded-2xl border border-violet-200/70 bg-gradient-to-r from-violet-50 via-white to-fuchsia-50 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">Workspace</p>
        <h2 className="mt-1 font-display text-xl font-bold text-ink">Business settings</h2>
        <p className="mt-1 text-sm text-muted">
          Keep your company details current for orders, links, and team visibility.
        </p>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <ErrorState description={getFriendlyErrorMessage(error)} onRetry={() => void refetch()} />
      ) : (
        <Card className="app-panel max-w-2xl rounded-2xl border-violet-100">
          <CardHeader>
            <CardTitle>Business profile</CardTitle>
            <CardDescription>Update the basics shown across your Ennitant workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={handleSubmit(async (values) => {
                try {
                  await mutation.mutateAsync(values)
                } catch (err) {
                  setError('root', {
                    message: getFriendlyErrorMessage(err, 'Unable to save settings.'),
                  })
                }
              })}
              noValidate
            >
              <div>
                <Label htmlFor="settings-name">Business name</Label>
                <Input id="settings-name" error={Boolean(errors.name)} {...register('name')} />
                {errors.name ? <p className="mt-1 text-xs text-danger">{errors.name.message}</p> : null}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="settings-phone">Phone</Label>
                  <Input id="settings-phone" {...register('phone')} />
                </div>
                <div>
                  <Label htmlFor="settings-email">Email</Label>
                  <Input id="settings-email" type="email" error={Boolean(errors.email)} {...register('email')} />
                  {errors.email ? <p className="mt-1 text-xs text-danger">{errors.email.message}</p> : null}
                </div>
              </div>
              <div>
                <Label htmlFor="settings-address">Address</Label>
                <Input id="settings-address" {...register('address')} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="settings-timezone">Timezone</Label>
                  <Input id="settings-timezone" {...register('timezone')} />
                </div>
                <div>
                  <Label htmlFor="settings-currency">Currency</Label>
                  <Select id="settings-currency" {...register('currency')}>
                    <option value="USD">USD</option>
                    <option value="PKR">PKR</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="AED">AED</option>
                    <option value="INR">INR</option>
                  </Select>
                </div>
              </div>
              {errors.root ? (
                <p className="text-sm text-danger" role="alert">
                  {errors.root.message}
                </p>
              ) : null}
              {mutation.isSuccess ? (
                <p className="text-sm text-success" role="status">
                  Settings saved.
                </p>
              ) : null}
              <Button
                type="submit"
                className="rounded-xl bg-violet-600 hover:bg-violet-700"
                loading={isSubmitting || mutation.isPending}
              >
                Save changes
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </AppShell>
  )
}
