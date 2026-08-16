import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { apiPost, apiUpload, getFriendlyErrorMessage } from '@/lib/api'

const PLATFORMS = ['INSTAGRAM', 'FACEBOOK', 'TIKTOK', 'YOUTUBE', 'LINKEDIN'] as const

export function CampaignWizardPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [platforms, setPlatforms] = useState<string[]>(['INSTAGRAM'])
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)

  const create = useMutation({
    mutationFn: async () => {
      const campaign = await apiPost<{ id: string }>('/campaigns', { name, description, platforms })
      for (const file of files) {
        await apiUpload(`/campaigns/${campaign.id}/media`, file)
      }
      return campaign
    },
    onSuccess: (campaign) => {
      void queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      navigate(`/campaigns/${campaign.id}`)
    },
    onError: (err) => setError(getFriendlyErrorMessage(err, 'Unable to create campaign.')),
  })

  return (
    <AppShell title="Create campaign">
      <form
        className="app-panel mx-auto max-w-xl space-y-4 rounded-2xl p-6"
        onSubmit={(event) => {
          event.preventDefault()
          setError(null)
          create.mutate()
        }}
      >
        <div>
          <Label htmlFor="name">Campaign name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <fieldset>
          <legend className="text-sm font-medium">Platforms</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {PLATFORMS.map((platform) => {
              const on = platforms.includes(platform)
              return (
                <button
                  key={platform}
                  type="button"
                  className={`rounded-full px-3 py-1 text-sm ${on ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}
                  onClick={() =>
                    setPlatforms((current) =>
                      on ? current.filter((item) => item !== platform) : [...current, platform],
                    )
                  }
                >
                  {platform}
                </button>
              )
            })}
          </div>
        </fieldset>
        <div>
          <Label htmlFor="media">Video or image (MP4, MOV, JPG, PNG)</Label>
          <Input
            id="media"
            type="file"
            multiple
            accept="video/mp4,video/quicktime,image/jpeg,image/png"
            onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
          />
          {files.length ? <p className="mt-1 text-xs text-muted">{files.length} file(s) selected</p> : null}
        </div>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" loading={create.isPending} disabled={!name.trim()}>
          Save draft
        </Button>
      </form>
    </AppShell>
  )
}
