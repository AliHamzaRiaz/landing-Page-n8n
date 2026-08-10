import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, error, children, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(
        'h-10 w-full rounded-lg border bg-surface px-3 text-sm text-ink transition focus-ring',
        error ? 'border-danger' : 'border-border hover:border-slate-300',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
})
