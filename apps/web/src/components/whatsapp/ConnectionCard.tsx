import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import type { WhatsAppStatus } from '@/types'

function toneFor(status: WhatsAppStatus['status']) {
  switch (status) {
    case 'CONNECTED':
      return 'success' as const
    case 'CONNECTING':
      return 'warning' as const
    case 'ERROR':
      return 'danger' as const
    default:
      return 'muted' as const
  }
}

export function ConnectionCard({
  status,
  loading,
  onTest,
  onDisconnect,
  testing,
  disconnecting,
}: {
  status?: WhatsAppStatus
  loading?: boolean
  onTest: () => void
  onDisconnect: () => void
  testing?: boolean
  disconnecting?: boolean
}) {
  if (loading) {
    return <div className="skeleton h-48" />
  }

  const current = status?.status ?? 'DISCONNECTED'

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Connection status</CardTitle>
          <CardDescription>
            Monitor your WhatsApp Business connection. Access tokens are never displayed.
          </CardDescription>
        </div>
        <Badge tone={toneFor(current)}>{current}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Phone</dt>
            <dd className="mt-1 text-sm font-medium">{status?.phoneNumber || 'Not connected'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Display name</dt>
            <dd className="mt-1 text-sm font-medium">{status?.displayName || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Connected at</dt>
            <dd className="mt-1 text-sm font-medium">
              {status?.connectedAt ? new Date(status.connectedAt).toLocaleString() : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">Last checked</dt>
            <dd className="mt-1 text-sm font-medium">
              {status?.lastCheckedAt ? new Date(status.lastCheckedAt).toLocaleString() : '—'}
            </dd>
          </div>
        </dl>
        {status?.errorMessage ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger" role="alert">
            {status.errorMessage}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={onTest}
            loading={testing}
            disabled={current === 'DISCONNECTED'}
          >
            Test connection
          </Button>
          <Button
            variant="danger"
            onClick={onDisconnect}
            loading={disconnecting}
            disabled={current === 'DISCONNECTED'}
          >
            Disconnect
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
