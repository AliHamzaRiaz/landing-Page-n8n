import { useQuery } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { ErrorState } from '@/components/ui/ErrorState'
import { apiGet, getFriendlyErrorMessage } from '@/lib/api'

type Analytics = {
  totals: {
    campaigns: number
    activeCampaigns: number
    scheduledPosts: number
    publishedPosts: number
    failedPosts: number
    connectedAccounts: number
  }
  platformBreakdown: Record<string, number>
  history: Array<{ id: string; platform: string; status: string; campaign: { name: string } }>
}

export function AnalyticsPage() {
  const query = useQuery({
    queryKey: ['campaign-analytics'],
    queryFn: () => apiGet<Analytics>('/analytics'),
  })

  const totals = query.data?.totals

  return (
    <AppShell title="Analytics">
      <p className="mb-4 text-sm text-muted">
        Counts come from Ennitant’s publish records only. Platform impressions are not invented.
      </p>
      {query.error ? <ErrorState description={getFriendlyErrorMessage(query.error)} /> : null}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ['Campaigns', totals?.campaigns],
          ['Published', totals?.publishedPosts],
          ['Failed', totals?.failedPosts],
          ['Scheduled', totals?.scheduledPosts],
          ['Active campaigns', totals?.activeCampaigns],
          ['Connected accounts', totals?.connectedAccounts],
        ].map(([label, value]) => (
          <div key={String(label)} className="app-panel rounded-2xl p-4">
            <p className="text-sm text-muted">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value ?? '—'}</p>
          </div>
        ))}
      </div>
      <h2 className="mt-8 text-lg font-semibold">Publishing history</h2>
      <ul className="mt-3 space-y-2">
        {query.data?.history.map((row) => (
          <li key={row.id} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
            {row.campaign.name} · {row.platform} · {row.status}
          </li>
        )) ?? null}
      </ul>
    </AppShell>
  )
}
