import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Spinner } from '@/components/ui/Spinner'
import { apiGet, getFriendlyErrorMessage } from '@/lib/api'

type PostRow = {
  id: string
  campaignId: string
  platform: string
  status: string
  scheduledAt: string | null
  caption: string
  errorMessage: string | null
}

function dayKey(iso: string | null) {
  if (!iso) return 'Unscheduled'
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function ScheduledPostsPage() {
  const query = useQuery({
    queryKey: ['scheduled-posts'],
    queryFn: () => apiGet<PostRow[]>('/posts', { status: 'SCHEDULED' }),
  })

  const grouped = new Map<string, PostRow[]>()
  for (const post of query.data ?? []) {
    const key = dayKey(post.scheduledAt)
    grouped.set(key, [...(grouped.get(key) ?? []), post])
  }

  return (
    <AppShell title="Scheduled posts">
      <p className="mb-4 text-sm text-muted">
        Jobs run from the campaign timezone stored on the campaign. Status updates after the publisher talks to the
        official platform API.
      </p>
      {query.isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : query.error ? (
        <ErrorState description={getFriendlyErrorMessage(query.error)} onRetry={() => void query.refetch()} />
      ) : !query.data?.length ? (
        <EmptyState title="Nothing scheduled" description="Schedule a campaign from the campaign details page." />
      ) : (
        <div className="space-y-6">
          {[...grouped.entries()].map(([day, posts]) => (
            <section key={day}>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">{day}</h2>
              <ul className="space-y-2">
                {posts.map((post) => (
                  <li key={post.id} className="app-panel rounded-2xl p-4 text-sm">
                    <Link to={`/campaigns/${post.campaignId}`} className="font-semibold text-ink hover:underline">
                      {post.platform}
                    </Link>
                    <p className="text-muted">
                      {post.scheduledAt ? new Date(post.scheduledAt).toLocaleTimeString() : '—'} · {post.status}
                    </p>
                    {post.errorMessage ? <p className="text-danger">{post.errorMessage}</p> : null}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </AppShell>
  )
}
