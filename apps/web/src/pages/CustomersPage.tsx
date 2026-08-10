import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { CustomersTable } from '@/components/customers/CustomersTable'
import { ErrorState } from '@/components/ui/ErrorState'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { apiGet, getFriendlyErrorMessage } from '@/lib/api'
import type { Customer, Paginated } from '@/types'

export function CustomersPage() {
  const [search, setSearch] = useState('')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['customers', search],
    queryFn: () =>
      apiGet<Paginated<Customer> | Customer[]>('/customers', {
        search: search || undefined,
      }),
  })

  const customers = Array.isArray(data) ? data : (data?.items ?? [])

  return (
    <AppShell title="Customers">
      <div className="mb-4 max-w-md">
        <Label htmlFor="customer-search">Search customers</Label>
        <Input
          id="customer-search"
          placeholder="Name or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {error ? (
        <ErrorState description={getFriendlyErrorMessage(error)} onRetry={() => void refetch()} />
      ) : (
        <CustomersTable customers={customers} loading={isLoading} />
      )}
    </AppShell>
  )
}
