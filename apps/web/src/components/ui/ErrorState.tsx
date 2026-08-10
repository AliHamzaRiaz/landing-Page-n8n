import type { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export function ErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
  action,
  className,
}: {
  title?: string
  description?: string
  onRetry?: () => void
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-red-100 bg-red-50/60 px-6 py-10 text-center',
        className,
      )}
      role="alert"
    >
      <AlertTriangle className="mb-3 h-7 w-7 text-danger" aria-hidden />
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description ? <p className="mt-1 max-w-md text-sm text-muted">{description}</p> : null}
      <div className="mt-4 flex items-center gap-2">
        {onRetry ? (
          <Button variant="outline" onClick={onRetry}>
            Try again
          </Button>
        ) : null}
        {action}
      </div>
    </div>
  )
}
