import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { OrderStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, currency = 'USD') {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0)
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat(undefined).format(Number.isFinite(value) ? value : 0)
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  DISPATCHED: 'Dispatched',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
}

export function formatOrderStatus(status: OrderStatus | string): string {
  if (status in STATUS_LABELS) {
    return STATUS_LABELS[status as OrderStatus]
  }
  return String(status)
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function statusTone(status: OrderStatus | string): 'warning' | 'info' | 'success' | 'danger' | 'muted' {
  switch (status) {
    case 'PENDING':
      return 'warning'
    case 'CONFIRMED':
    case 'PROCESSING':
    case 'SHIPPED':
    case 'DISPATCHED':
      return 'info'
    case 'DELIVERED':
      return 'success'
    case 'CANCELLED':
      return 'danger'
    default:
      return 'muted'
  }
}

export function timeOfDayGreeting(date = new Date()): string {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}
