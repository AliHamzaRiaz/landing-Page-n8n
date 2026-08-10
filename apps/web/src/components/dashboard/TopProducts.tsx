import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatCurrency, formatNumber } from '@/lib/utils'

export function TopProducts({
  data,
  currency = 'USD',
  loading,
}: {
  data?: Array<{ productId: string; name: string; quantity: number; revenue: number }>
  currency?: string
  loading?: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top products</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : !data?.length ? (
          <p className="text-sm text-muted">No product data yet.</p>
        ) : (
          <ul className="space-y-3">
            {data.map((item) => (
              <li key={item.productId} className="flex items-center justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium text-ink">{item.name}</p>
                  <p className="text-muted">{formatNumber(item.quantity)} sold</p>
                </div>
                <p className="font-medium text-ink">{formatCurrency(item.revenue, currency)}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
