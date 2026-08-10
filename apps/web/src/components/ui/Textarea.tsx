import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, error, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'min-h-24 w-full rounded-lg border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted/80 transition focus-ring',
        error ? 'border-danger' : 'border-border hover:border-slate-300',
        className,
      )}
      {...props}
    />
  )
})
