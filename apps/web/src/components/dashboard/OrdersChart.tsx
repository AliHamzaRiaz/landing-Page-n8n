import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

export function OrdersChart({
  data,
  loading,
}: {
  data?: Array<{ date: string; count: number }>
  loading?: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders over time</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted">Loading chart…</div>
        ) : !data?.length ? (
          <div className="flex h-full items-center justify-center text-sm text-muted">No chart data yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#0f766e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
