import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { ConnectionCard } from '@/components/whatsapp/ConnectionCard'
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

  return (
    <AppShell title="WhatsApp">
      <div className="space-y-6">
        {statusQuery.error ? (
          <ErrorState
            description={getFriendlyErrorMessage(statusQuery.error)}
            onRetry={() => void statusQuery.refetch()}
          />
        ) : (
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
        )}

        <Card>
          <CardHeader>
            <CardTitle>Your WhatsApp number</CardTitle>
            <CardDescription>
              WhatsApp is connected during onboarding using your business number. You never need API
              tokens or Meta IDs — Ennitant handles that behind the scenes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted">
              To change your business WhatsApp number, update it in Settings or contact support.
              Incoming customer messages are matched to your business automatically.
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
