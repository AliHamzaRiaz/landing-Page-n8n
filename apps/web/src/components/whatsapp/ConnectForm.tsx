import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'

const schema = z.object({
  phoneNumberId: z.string().min(3, 'Phone number ID is required'),
  accessToken: z.string().min(10, 'Access token is required'),
  displayPhoneNumber: z.string().optional(),
  wabaId: z.string().optional(),
})

export type ConnectFormValues = z.infer<typeof schema>

export function ConnectForm({
  submitting,
  onSubmit,
}: {
  submitting?: boolean
  onSubmit: (values: ConnectFormValues) => Promise<void> | void
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ConnectFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      phoneNumberId: '',
      accessToken: '',
      displayPhoneNumber: '',
      wabaId: '',
    },
  })

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div>
        <Label htmlFor="wa-phone-id">Phone Number ID</Label>
        <Input id="wa-phone-id" error={Boolean(errors.phoneNumberId)} {...register('phoneNumberId')} />
        {errors.phoneNumberId ? (
          <p className="mt-1 text-xs text-danger">{errors.phoneNumberId.message}</p>
        ) : null}
      </div>
      <div>
        <Label htmlFor="wa-token">Access Token</Label>
        <Input
          id="wa-token"
          type="password"
          autoComplete="off"
          error={Boolean(errors.accessToken)}
          {...register('accessToken')}
        />
        <p className="mt-1 text-xs text-muted">
          Tokens are stored securely on the server and never shown again.
        </p>
        {errors.accessToken ? (
          <p className="mt-1 text-xs text-danger">{errors.accessToken.message}</p>
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="wa-display">Display phone (optional)</Label>
          <Input id="wa-display" {...register('displayPhoneNumber')} />
        </div>
        <div>
          <Label htmlFor="wa-waba">WABA ID (optional)</Label>
          <Input id="wa-waba" {...register('wabaId')} />
        </div>
      </div>
      <Button type="submit" loading={submitting}>
        Connect WhatsApp
      </Button>
    </form>
  )
}
