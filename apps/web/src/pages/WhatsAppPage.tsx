import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { WhatsAppSetupHub } from '@/components/whatsapp/WhatsAppSetupHub'
import { ErrorState } from '@/components/ui/ErrorState'
import { apiGet, apiPost, getFriendlyErrorMessage } from '@/lib/api'
import { toWaMeUrl } from '@/lib/whatsapp-link'
import type { WhatsAppStatus } from '@/types'

export function WhatsAppPage() {
  const { user, business } = useAuth()
  const queryClient = useQueryClient()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const initial = (user?.name || user?.phoneNumber || 'U').slice(0, 2).toUpperCase()

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
      setMessage('WhatsApp disconnected. You can connect a different number.')
      setError(null)
      void queryClient.invalidateQueries({ queryKey: ['whatsapp-status'] })
    },
    onError: (err) => setError(getFriendlyErrorMessage(err, 'Unable to disconnect.')),
  })

  const phone = statusQuery.data?.phoneNumber || statusQuery.data?.displayPhoneNumber
  const chatUrl = statusQuery.data?.customerChatUrl || toWaMeUrl(phone)

  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3 sm:px-8">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="font-display text-lg font-bold tracking-tight text-slate-900">
            Ennitant
          </Link>
          <Link to="/dashboard" className="text-sm text-slate-500 hover:text-slate-800">
            Dashboard
          </Link>
        </div>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white"
          title={business?.companyName || user?.name || 'Account'}
        >
          {initial}
        </div>
      </header>

      {statusQuery.error ? (
        <div className="mx-auto max-w-xl px-4 py-16">
          <ErrorState
            description={getFriendlyErrorMessage(statusQuery.error)}
            onRetry={() => void statusQuery.refetch()}
          />
        </div>
      ) : (
        <WhatsAppSetupHub
          status={statusQuery.data}
          loading={statusQuery.isLoading}
          chatUrl={chatUrl}
          phone={phone}
          message={message}
          error={error}
          onConnected={() => {
            setMessage('WhatsApp connected successfully.')
            setError(null)
            void queryClient.invalidateQueries({ queryKey: ['whatsapp-status'] })
          }}
          onTest={() => testMutation.mutate()}
          onDisconnect={() => {
            if (
              window.confirm(
                'Disconnect WhatsApp from this business? You can connect a different number after that.',
              )
            ) {
              disconnectMutation.mutate()
            }
          }}
          testing={testMutation.isPending}
          disconnecting={disconnectMutation.isPending}
        />
      )}
    </div>
  )
}
