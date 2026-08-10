import { Label } from '@/components/ui/Label'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import type { OrderStatus } from '@/types'

export interface OrderFilterState {
  search: string
  status: OrderStatus | ''
  from: string
  to: string
  sort: 'createdAt_desc' | 'createdAt_asc' | 'totalAmount_desc' | 'totalAmount_asc'
}

export function OrderFilters({
  value,
  onChange,
}: {
  value: OrderFilterState
  onChange: (next: OrderFilterState) => void
}) {
  return (
    <div className="grid gap-3 rounded-xl border border-border bg-surface p-4 md:grid-cols-2 xl:grid-cols-5">
      <div className="xl:col-span-2">
        <Label htmlFor="order-search">Search</Label>
        <Input
          id="order-search"
          placeholder="Customer, phone, or order ID"
          value={value.search}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="order-status">Status</Label>
        <Select
          id="order-status"
          value={value.status}
          onChange={(e) => onChange({ ...value, status: e.target.value as OrderStatus | '' })}
        >
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PROCESSING">Processing</option>
          <option value="DISPATCHED">Dispatched</option>
          <option value="SHIPPED">Shipped</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="order-from">From</Label>
        <Input
          id="order-from"
          type="date"
          value={value.from}
          onChange={(e) => onChange({ ...value, from: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="order-to">To</Label>
        <Input
          id="order-to"
          type="date"
          value={value.to}
          onChange={(e) => onChange({ ...value, to: e.target.value })}
        />
      </div>
      <div className="md:col-span-2 xl:col-span-5">
        <Label htmlFor="order-sort">Sort</Label>
        <Select
          id="order-sort"
          value={value.sort}
          onChange={(e) => onChange({ ...value, sort: e.target.value as OrderFilterState['sort'] })}
        >
          <option value="createdAt_desc">Newest first</option>
          <option value="createdAt_asc">Oldest first</option>
          <option value="totalAmount_desc">Highest total</option>
          <option value="totalAmount_asc">Lowest total</option>
        </Select>
      </div>
    </div>
  )
}
