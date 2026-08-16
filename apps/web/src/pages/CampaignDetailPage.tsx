import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/ErrorState'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Spinner } from '@/components/ui/Spinner'
import { Textarea } from '@/components/ui/Textarea'
import { apiGet, apiPost, getFriendlyErrorMessage } from '@/lib/api'

type Generated = {
  provider: string
  caption: string
  hashtags: string[]
  platforms: Array<{ platform: string; caption: string; hashtags: string }>
  suggestedPostingTime: string
}

type CampaignDetail = {
  id: string
  name: string
  status: string
  timezone: string
  platforms: string[]
  media: Array<{ id: string; filename: string }>
  posts: Array<{
    id: string
    platform: string
    status: string
    errorMessage?: string | null
    scheduledAt?: string | null
  }>
  aiContent?: Generated | null
}

export function CampaignDetailPage() {
  const { id = '' } = useParams()
  const queryClient = useQueryClient()
  const [captions, setCaptions] = useState<Record<string, { caption: string; hashtags: string }>>({})
  const [scheduledAt, setScheduledAt] = useState('')
  const [timezone, setTimezone] = useState('UTC')
  const [message, setMessage] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => apiGet<CampaignDetail>(`/campaigns/${id}`),
    enabled: Boolean(id),
  })

  const storedCaptions = Object.fromEntries(
    (query.data?.aiContent?.platforms ?? []).map((row) => [
      row.platform,
      { caption: row.caption, hashtags: row.hashtags },
    ]),
  )
  const displayCaptions = Object.keys(captions).length ? captions : storedCaptions

  const generate = useMutation({
    mutationFn: () => apiPost<Generated>(`/campaigns/${id}/generate-content`),
    onSuccess: (content) => {
      const next: Record<string, { caption: string; hashtags: string }> = {}
      for (const row of content.platforms) {
        next[row.platform] = { caption: row.caption, hashtags: row.hashtags }
      }
      setCaptions(next)
      void queryClient.invalidateQueries({ queryKey: ['campaign', id] })
    },
  })

  const confirm = useMutation({
    mutationFn: (postingType: 'NOW' | 'SCHEDULE' | 'DRAFT') => {
      const copy =
        Object.keys(captions).length > 0
          ? captions
          : Object.fromEntries(
              (query.data?.aiContent?.platforms ?? []).map((row) => [
                row.platform,
                { caption: row.caption, hashtags: row.hashtags },
              ]),
            )
      return apiPost(`/campaigns/${id}/confirm`, {
        postingType,
        platforms: query.data?.platforms?.length ? query.data.platforms : ['INSTAGRAM'],
        captions: copy,
        scheduledAt: postingType === 'SCHEDULE' ? new Date(scheduledAt).toISOString() : undefined,
        timezone,
      })
    },
    onSuccess: () => {
      setMessage(
        'Jobs queued. Publishing uses official APIs only and stays failed until the platform is connected and media is publicly reachable.',
      )
      void queryClient.invalidateQueries({ queryKey: ['campaign', id] })
    },
  })

  return (
    <AppShell title={query.data?.name || 'Campaign'}>
      {query.isLoading ? (
        <Spinner />
      ) : query.error || !query.data ? (
        <ErrorState description={getFriendlyErrorMessage(query.error)} />
      ) : (
        <div className="space-y-6">
          <p className="text-sm text-muted">
            {query.data.status} · {query.data.media.length} file(s)
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => generate.mutate()} loading={generate.isPending}>
              Generate captions
            </Button>
            <Button variant="outline" onClick={() => confirm.mutate('NOW')} loading={confirm.isPending}>
              Publish now
            </Button>
            <Button
              variant="outline"
              onClick={() => confirm.mutate('SCHEDULE')}
              loading={confirm.isPending}
              disabled={!scheduledAt}
            >
              Schedule
            </Button>
            <Button variant="ghost" onClick={() => confirm.mutate('DRAFT')}>
              Keep as draft
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="schedule">Schedule (local time)</Label>
              <Input
                id="schedule"
                type="datetime-local"
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="tz">Timezone</Label>
              <Input id="tz" value={timezone} onChange={(event) => setTimezone(event.target.value)} />
            </div>
          </div>
          {generate.data ? (
            <p className="text-xs text-muted">
              Source: {generate.data.provider}
              {generate.data.provider === 'heuristic' ? ' (no AI_API_KEY — edit before posting)' : ''}. Suggested time:{' '}
              {generate.data.suggestedPostingTime}
            </p>
          ) : null}
          {Object.entries(displayCaptions).map(([platform, value]) => (
            <label key={platform} className="block space-y-1">
              <span className="text-sm font-medium">{platform}</span>
              <Textarea
                value={`${value.caption}\n${value.hashtags}`}
                onChange={(event) => {
                  const [caption, ...rest] = event.target.value.split('\n')
                  setCaptions((current) => ({
                    ...current,
                    [platform]: { caption, hashtags: rest.join('\n') },
                  }))
                }}
              />
            </label>
          ))}
          {query.data.posts.length ? (
            <ul className="space-y-2 text-sm">
              {query.data.posts.map((post) => (
                <li key={post.id} className="rounded-xl border border-slate-200 px-3 py-2">
                  {post.platform}: {post.status}
                  {post.scheduledAt ? ` · ${new Date(post.scheduledAt).toLocaleString()}` : ''}
                  {post.errorMessage ? ` — ${post.errorMessage}` : ''}
                </li>
              ))}
            </ul>
          ) : null}
          {message ? <p className="text-sm text-indigo-700">{message}</p> : null}
          {confirm.error ? (
            <p className="text-sm text-danger">{getFriendlyErrorMessage(confirm.error)}</p>
          ) : null}
        </div>
      )}
    </AppShell>
  )
}
