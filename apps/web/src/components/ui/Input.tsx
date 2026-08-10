import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, error, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded-lg border bg-surface px-3 text-sm text-ink placeholder:text-muted/80 transition focus-ring',
        error ? 'border-danger' : 'border-border hover:border-slate-300',
        className,
      )}
      {...props}
    />
  )
})
