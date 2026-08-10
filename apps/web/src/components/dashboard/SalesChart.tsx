import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'

export function SalesChart({
  data,
  currency = 'USD',
  loading,
}: {
  data?: Array<{ date: string; amount: number }>
  currency?: string
  loading?: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales over time</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted">Loading chart…</div>
        ) : !data?.length ? (
          <div className="flex h-full items-center justify-center text-sm text-muted">No chart data yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => formatCurrency(Number(value), currency)} />
              <Tooltip formatter={(value) => formatCurrency(Number(value), currency)} />
              <Bar dataKey="amount" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
