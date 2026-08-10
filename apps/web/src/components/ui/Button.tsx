import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/ui/Spinner'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variants: Record<Variant, string> = {
  primary:
    'bg-brand text-white hover:bg-brand-dark shadow-sm shadow-teal-900/10 disabled:bg-brand/60',
  secondary: 'bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-400',
  ghost: 'bg-transparent text-ink hover:bg-slate-100 disabled:text-muted',
  danger: 'bg-danger text-white hover:bg-red-700 disabled:bg-red-300',
  outline:
    'border border-border bg-surface text-ink hover:bg-slate-50 disabled:text-muted disabled:bg-slate-50',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', loading, disabled, children, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition focus-ring disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? <Spinner size="sm" className="border-white/40 border-t-white" /> : null}
      {children}
    </button>
  )
})
