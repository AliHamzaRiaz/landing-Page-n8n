import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/ErrorState'
import { apiDelete, apiGet, apiPost, getFriendlyErrorMessage } from '@/lib/api'

const PLATFORMS = ['facebook', 'instagram', 'tiktok', 'youtube', 'linkedin'] as const

type Account = {
  id: string
  platform: string
  accountName: string
  status: string
  lastError?: string | null
}

export function SocialAccountsPage() {
  const [params] = useSearchParams()
  const queryClient = useQueryClient()
  const flash = params.get('connected') || params.get('error')

  const query = useQuery({
    queryKey: ['social-accounts'],
    queryFn: () => apiGet<Account[]>('/social-accounts'),
  })

  const connect = useMutation({
    mutationFn: (platform: string) => apiPost<{ authorizationUrl: string }>(`/social-accounts/${platform}/connect`),
    onSuccess: (payload) => {
      window.location.assign(payload.authorizationUrl)
    },
  })

  const disconnect = useMutation({
    mutationFn: (id: string) => apiDelete(`/social-accounts/${id}`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['social-accounts'] }),
  })

  const test = useMutation({
    mutationFn: (id: string) => apiPost(`/social-accounts/${id}/test`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['social-accounts'] }),
  })

  const reconnect = useMutation({
    mutationFn: (id: string) => apiPost<{ authorizationUrl: string }>(`/social-accounts/${id}/reconnect`),
    onSuccess: (payload) => {
      window.location.assign(payload.authorizationUrl)
    },
  })

  return (
    <AppShell title="Social accounts">
      <p className="mb-4 text-sm text-muted">
        Official OAuth only. Access tokens stay on the server. Instagram/Facebook need Facebook Login on your Meta
        app (separate from WhatsApp Embedded Signup). TikTok, YouTube, and LinkedIn stay disabled until those apps are
        approved.
      </p>
      {flash ? <p className="mb-3 text-sm text-indigo-700">{flash}</p> : null}
      {query.error ? (
        <ErrorState description={getFriendlyErrorMessage(query.error)} />
      ) : (
        <ul className="space-y-3">
          {PLATFORMS.map((platform) => {
            const account = query.data?.find((row) => row.platform.toLowerCase() === platform)
            return (
              <li key={platform} className="app-panel flex items-center justify-between rounded-2xl p-4">
                <div>
                  <p className="font-semibold capitalize">{platform}</p>
                  <p className="text-sm text-muted">
                    {account ? `${account.accountName} · ${account.status}` : 'Not connected'}
                    {account?.lastError ? ` — ${account.lastError}` : ''}
                  </p>
                </div>
                {account && account.status === 'CONNECTED' ? (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => test.mutate(account.id)} loading={test.isPending}>
                      Test
                    </Button>
                    <Button variant="outline" onClick={() => disconnect.mutate(account.id)}>
                      Disconnect
                    </Button>
                  </div>
                ) : account ? (
                  <Button onClick={() => reconnect.mutate(account.id)} loading={reconnect.isPending}>
                    Reconnect
                  </Button>
                ) : (
                  <Button onClick={() => connect.mutate(platform)} loading={connect.isPending}>
                    Connect
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </AppShell>
  )
}
