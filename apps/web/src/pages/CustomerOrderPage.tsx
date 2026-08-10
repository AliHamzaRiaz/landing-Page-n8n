import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/ErrorState'
import { Spinner } from '@/components/ui/Spinner'
import { apiGet, getFriendlyErrorMessage } from '@/lib/api'
import type { PublicOrderPage } from '@/types'

export function CustomerOrderPage() {
  const { businessSlug = '' } = useParams()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['public-order', businessSlug],
    queryFn: () => apiGet<PublicOrderPage>(`/public/order/${businessSlug}`),
    enabled: Boolean(businessSlug),
  })

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-10">
      <p className="text-center font-display text-2xl font-semibold text-brand">Ennitant</p>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="mt-10">
          <ErrorState
            title="Page unavailable"
            description={getFriendlyErrorMessage(error, 'This order page is not available.')}
            onRetry={() => void refetch()}
          />
        </div>
      ) : (
        <div className="mt-10 flex flex-1 flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-2xl font-semibold text-brand">
            {(data?.businessName || 'B').charAt(0).toUpperCase()}
          </div>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Order from {data?.businessName} on WhatsApp
          </h1>
          <p className="mt-3 max-w-sm text-muted">Place your order directly through WhatsApp.</p>
          {data?.whatsappUrl ? (
            <a href={data.whatsappUrl} target="_blank" rel="noreferrer" className="mt-8 w-full">
              <Button size="lg" className="w-full">
                <MessageCircle className="h-5 w-5" aria-hidden />
                Order on WhatsApp
              </Button>
            </a>
          ) : (
            <p className="mt-8 text-sm text-muted">WhatsApp ordering is temporarily unavailable.</p>
          )}
        </div>
      )}
    </div>
  )
}
