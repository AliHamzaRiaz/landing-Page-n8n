import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Tone = 'default' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'muted'

const tones: Record<Tone, string> = {
  default: 'bg-slate-100 text-slate-700',
  brand: 'bg-teal-50 text-brand-dark',
  success: 'bg-emerald-50 text-success',
  warning: 'bg-amber-50 text-warning',
  danger: 'bg-red-50 text-danger',
  info: 'bg-sky-50 text-sky-700',
  muted: 'bg-slate-100 text-muted',
}

export function Badge({
  className,
  tone = 'default',
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold tracking-wide',
        tones[tone],
        className,
      )}
      {...props}
    />
  )
}
