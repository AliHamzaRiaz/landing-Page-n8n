import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { apiDelete, apiGet, apiUpload, getFriendlyErrorMessage } from '@/lib/api'

type MediaRow = {
  id: string
  filename: string
  mimeType: string
  sizeBytes: number
  publicUrl: string | null
  status: string
  createdAt: string
}

export function MediaLibraryPage() {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ['media-library'],
    queryFn: () => apiGet<MediaRow[]>('/media'),
  })

  const upload = useMutation({
    mutationFn: (file: File) => apiUpload('/media', file),
    onSuccess: () => {
      setError(null)
      void queryClient.invalidateQueries({ queryKey: ['media-library'] })
    },
    onError: (err) => setError(getFriendlyErrorMessage(err, 'Upload failed.')),
  })

  const remove = useMutation({
    mutationFn: (id: string) => apiDelete(`/media/${id}`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['media-library'] }),
  })

  return (
    <AppShell title="Media library">
      <p className="mb-4 text-sm text-muted">
        Uploads are stored as files, not database blobs. Publishing to Facebook/Instagram still needs a public HTTPS URL
        (`STORAGE_PUBLIC_BASE_URL`).
      </p>
      <Input
        type="file"
        accept="video/mp4,video/quicktime,image/jpeg,image/png"
        aria-label="Upload media"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) upload.mutate(file)
          event.target.value = ''
        }}
      />
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      {query.isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : query.error ? (
        <ErrorState description={getFriendlyErrorMessage(query.error)} onRetry={() => void query.refetch()} />
      ) : !query.data?.length ? (
        <EmptyState title="No media yet" description="Upload an MP4, MOV, JPG, or PNG." />
      ) : (
        <ul className="mt-4 space-y-3">
          {query.data.map((item) => (
            <li key={item.id} className="app-panel flex items-center justify-between rounded-2xl p-4">
              <div>
                <p className="font-semibold text-ink">{item.filename}</p>
                <p className="text-sm text-muted">
                  {item.mimeType} · {Math.round(item.sizeBytes / 1024)} KB · {item.status}
                  {item.publicUrl ? ' · public URL set' : ' · local only'}
                </p>
              </div>
              <Button variant="outline" onClick={() => remove.mutate(item.id)} loading={remove.isPending}>
                Delete
              </Button>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  )
}
