import { cn } from '@/lib/utils'

export function Spinner({
  className,
  size = 'md',
  label = 'Loading',
}: {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  label?: string
}) {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-[3px]',
  }

  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        'inline-block animate-spin rounded-full border-slate-200 border-t-brand',
        sizes[size],
        className,
      )}
    />
  )
}
