import { Badge } from '@/components/ui/Badge'
import { formatOrderStatus, statusTone } from '@/lib/utils'
import type { OrderStatus } from '@/types'

const toneMap = {
  warning: 'warning',
  info: 'info',
  success: 'success',
  danger: 'danger',
  muted: 'muted',
} as const

export function StatusBadge({ status }: { status: OrderStatus | string }) {
  return <Badge tone={toneMap[statusTone(status)]}>{formatOrderStatus(status)}</Badge>
}
