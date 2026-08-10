import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { CustomerDetail } from '@/components/customers/CustomerDetail'
import { ErrorState } from '@/components/ui/ErrorState'
import { Spinner } from '@/components/ui/Spinner'
import { apiGet, getFriendlyErrorMessage } from '@/lib/api'
import type { Customer } from '@/types'

export function CustomerDetailPage() {
  const { id = '' } = useParams()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['customers', id],
    queryFn: () => apiGet<Customer>(`/customers/${id}`),
    enabled: Boolean(id),
  })

  return (
    <AppShell title="Customer details">
      <div className="mb-4">
        <Link to="/customers" className="text-sm font-medium text-brand hover:underline">
          ← Back to customers
        </Link>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <ErrorState description={getFriendlyErrorMessage(error)} onRetry={() => void refetch()} />
      ) : !data ? (
        <ErrorState title="Customer not found" />
      ) : (
        <CustomerDetail customer={data} />
      )}
    </AppShell>
  )
}
