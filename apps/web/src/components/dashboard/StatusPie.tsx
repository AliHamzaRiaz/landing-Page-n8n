import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatOrderStatus } from '@/lib/utils'
import type { OrderStatus } from '@/types'

const COLORS = ['#0f766e', '#0ea5e9', '#d97706', '#059669', '#64748b', '#dc2626']

export function StatusPie({
  data,
  loading,
}: {
  data?: Array<{ status: OrderStatus; count: number }>
  loading?: boolean
}) {
  const chartData =
    data?.map((item) => ({
      name: formatOrderStatus(item.status),
      value: item.count,
    })) ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status distribution</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted">Loading chart…</div>
        ) : !chartData.length ? (
          <div className="flex h-full items-center justify-center text-sm text-muted">No chart data yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                {chartData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
