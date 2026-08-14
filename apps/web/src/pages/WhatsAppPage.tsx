import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { ConnectionCard } from '@/components/whatsapp/ConnectionCard'
import { EmbeddedSignupButton } from '@/components/whatsapp/EmbeddedSignupButton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { apiGet, apiPost, getFriendlyErrorMessage } from '@/lib/api'
import type { WhatsAppStatus } from '@/types'

export function WhatsAppPage() {
  const queryClient = useQueryClient()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const statusQuery = useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: () => apiGet<WhatsAppStatus>('/whatsapp/status'),
  })

  const testMutation = useMutation({
    mutationFn: () => apiPost('/whatsapp/test'),
    onSuccess: () => {
      setMessage('Connection test succeeded.')
      setError(null)
      void queryClient.invalidateQueries({ queryKey: ['whatsapp-status'] })
    },
    onError: (err) => setError(getFriendlyErrorMessage(err, 'Connection test failed.')),
  })

  const disconnectMutation = useMutation({
    mutationFn: () => apiPost('/whatsapp/disconnect'),
    onSuccess: () => {
      setMessage('WhatsApp disconnected.')
      setError(null)
      void queryClient.invalidateQueries({ queryKey: ['whatsapp-status'] })
    },
    onError: (err) => setError(getFriendlyErrorMessage(err, 'Unable to disconnect.')),
  })

  const connected = statusQuery.data?.status === 'CONNECTED'

  return (
    <AppShell title="WhatsApp">
      <div className="space-y-6">
        {statusQuery.error ? (
          <ErrorState
            description={getFriendlyErrorMessage(statusQuery.error)}
            onRetry={() => void statusQuery.refetch()}
          />
        ) : (
          <>
            {!connected && !statusQuery.isLoading ? (
              <Card>
                <CardHeader>
                  <CardTitle>Connect WhatsApp</CardTitle>
                  <CardDescription>
                    Link your WhatsApp Business Account through Meta Embedded Signup. Each business
                    uses its own phone number and credentials.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EmbeddedSignupButton
                    onConnected={() => {
                      setMessage('WhatsApp connected successfully.')
                      setError(null)
                      void queryClient.invalidateQueries({ queryKey: ['whatsapp-status'] })
                    }}
                  />
                </CardContent>
              </Card>
            ) : null}

            <ConnectionCard
              status={statusQuery.data}
              loading={statusQuery.isLoading}
              onTest={() => testMutation.mutate()}
              onDisconnect={() => {
                if (window.confirm('Disconnect WhatsApp from this business?')) {
                  disconnectMutation.mutate()
                }
              }}
              testing={testMutation.isPending}
              disconnecting={disconnectMutation.isPending}
            />
          </>
        )}

        <Card>
          <CardHeader>
            <CardTitle>How it works</CardTitle>
            <CardDescription>
              Customer messages arrive via Meta webhooks and are routed to your business by phone
              number ID. Outbound replies always use your connected WhatsApp account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted">
              Access tokens are encrypted server-side and never shown in the dashboard.
            </p>
          </CardContent>
        </Card>

        {message ? (
          <p className="text-sm text-success" role="status">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </AppShell>
  )
}
