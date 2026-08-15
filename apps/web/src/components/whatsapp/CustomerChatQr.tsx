import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'

export function CustomerChatQr({
  chatUrl,
  phone,
  embedded = false,
}: {
  chatUrl: string
  phone?: string | null
  embedded?: boolean
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void QRCode.toDataURL(chatUrl, {
      width: 240,
      margin: 1,
      errorCorrectionLevel: 'M',
    }).then((url) => {
      if (!cancelled) setDataUrl(url)
    })
    return () => {
      cancelled = true
    }
  }, [chatUrl])

  const body = (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        {dataUrl ? (
          <img src={dataUrl} alt="QR code to chat on WhatsApp" width={200} height={200} />
        ) : (
          <div className="skeleton h-[200px] w-[200px]" />
        )}
      </div>
      <div className="space-y-3 text-center sm:text-left">
        <p className="text-sm font-medium">Scan to chat with us</p>
        {phone ? <p className="text-sm text-muted">{phone}</p> : null}
        <p className="text-xs text-muted">
          This QR opens a customer chat with your number. It is not Meta’s onboarding QR.
        </p>
        <Button type="button" onClick={() => window.open(chatUrl, '_blank', 'noopener,noreferrer')}>
          Open WhatsApp
        </Button>
      </div>
    </div>
  )

  if (embedded) {
    return body
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your WhatsApp Bot is Ready</CardTitle>
        <CardDescription>
          This QR code opens a customer chat with your connected WhatsApp number. It is not the Meta
          onboarding QR.
        </CardDescription>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  )
}
