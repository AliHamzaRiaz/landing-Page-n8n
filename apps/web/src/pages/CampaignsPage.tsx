import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Spinner } from '@/components/ui/Spinner'
import { apiGet, getFriendlyErrorMessage } from '@/lib/api'

type CampaignRow = {
  id: string
  name: string
  status: string
  postingType: string
  createdAt: string
  _count?: { media: number; posts: number }
}

export function CampaignsPage() {
  const query = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => apiGet<CampaignRow[]>('/campaigns'),
  })

  return (
    <AppShell title="Campaigns">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted">Create a campaign, upload media, then publish or schedule.</p>
        <Link to="/campaigns/new">
          <Button>New campaign</Button>
        </Link>
      </div>
      {query.isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : query.error ? (
        <ErrorState description={getFriendlyErrorMessage(query.error)} onRetry={() => void query.refetch()} />
      ) : !query.data?.length ? (
        <EmptyState title="No campaigns yet" description="Start with a name, media, and the platforms you want to post to." />
      ) : (
        <ul className="space-y-3">
          {query.data.map((campaign) => (
            <li key={campaign.id}>
              <Link
                to={`/campaigns/${campaign.id}`}
                className="app-panel block rounded-2xl p-4 hover:border-indigo-200"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{campaign.name}</p>
                    <p className="text-sm text-muted">
                      {campaign.status} · {campaign._count?.media ?? 0} files · {campaign._count?.posts ?? 0} posts
                    </p>
                  </div>
                  <span className="text-xs font-semibold uppercase text-indigo-600">{campaign.postingType}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  )
}
