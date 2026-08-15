import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Cloud,
  Code2,
  ExternalLink,
  Inbox,
  KeyRound,
  Layers,
  Puzzle,
  RefreshCw,
  Send,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/utils'
import {
  defaultGuideStep,
  WHATSAPP_GUIDE_STEPS,
  WHATSAPP_PATHS,
  workflowSnippet,
  type WhatsAppGuideStep,
  type WhatsAppSetupPath,
} from '@/lib/whatsapp-setup'
import type { WhatsAppStatus } from '@/types'
import { CodeSnippet } from '@/components/whatsapp/CodeSnippet'
import { CustomerChatQr } from '@/components/whatsapp/CustomerChatQr'
import { EmbeddedSignupButton } from '@/components/whatsapp/EmbeddedSignupButton'

const DEVELOPER_FEATURES = [
  { icon: Cloud, title: 'Cloud API, direct', detail: 'Same WhatsApp Cloud API payloads as Meta’s docs.' },
  { icon: KeyRound, title: 'One number, one shop', detail: 'Inbound events are routed to this business only.' },
  { icon: Zap, title: 'Embedded Signup', detail: 'Numbers can go live in minutes through Meta.' },
  { icon: Layers, title: 'Full surface', detail: 'Messages, media, and order automation in one place.' },
]

const PRICING = [
  { icon: Inbox, title: 'Inbound: free', detail: 'Customer messages to your connected number.' },
  { icon: Send, title: 'Outbound: Meta rate', detail: 'Conversation charges come from Meta, not a hidden API key.' },
  { icon: Zap, title: 'Ennitant included', detail: 'Connection and order workflow are part of your account.' },
]

export function WhatsAppSetupHub({
  status,
  loading,
  chatUrl,
  phone,
  onConnected,
  onTest,
  onDisconnect,
  testing,
  disconnecting,
  message,
  error,
}: {
  status?: WhatsAppStatus
  loading?: boolean
  chatUrl?: string | null
  phone?: string | null
  onConnected: () => void
  onTest: () => void
  onDisconnect: () => void
  testing?: boolean
  disconnecting?: boolean
  message?: string | null
  error?: string | null
}) {
  const connected = status?.status === 'CONNECTED'
  const [path, setPath] = useState<WhatsAppSetupPath>('direct')
  const [step, setStep] = useState<WhatsAppGuideStep>(() => defaultGuideStep(false, 'direct'))

  useEffect(() => {
    setStep(defaultGuideStep(connected, path))
  }, [connected, path])

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  const snippet = workflowSnippet(step)
  const isDirect = path === 'direct'

  return (
    <div className="mx-auto max-w-[1120px] px-4 pb-16 pt-8 sm:px-6">
      <header className="text-center">
        <h1 className="text-[28px] font-bold tracking-tight text-slate-900 sm:text-[32px]">
          What kind of WhatsApp solution do you need?
        </h1>
        <p className="mt-2 text-[15px] text-slate-500">
          Pick the path that fits your business best — you can always change your mind.
        </p>
      </header>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {WHATSAPP_PATHS.map((item) => {
          const selected = path === item.id
          const Icon = item.id === 'marketplace' ? Puzzle : Code2
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setPath(item.id)}
              className={cn(
                'flex items-start gap-4 rounded-2xl border bg-white px-5 py-5 text-left transition',
                selected
                  ? 'border-[#7ec8e3] bg-[#f3f9fc] shadow-[0_0_0_1px_#7ec8e3]'
                  : 'border-slate-200 hover:border-slate-300',
              )}
            >
              <span
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border',
                  selected ? 'border-[#8fd0e8] bg-white text-[#2b9bb8]' : 'border-slate-200 text-slate-500',
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span>
                <span className="block text-[16px] font-semibold text-slate-900">{item.title}</span>
                <span className="mt-1 block text-sm text-slate-500">{item.subtitle}</span>
              </span>
            </button>
          )
        })}
      </div>

      <section className="mt-6 overflow-hidden rounded-[28px] border border-[#cfe8f2] bg-[#eef7fb] p-5 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-[28px] font-bold text-slate-900">
              {isDirect ? 'Direct API Access' : 'Plug&Play'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {isDirect
                ? 'Official Meta Cloud API. Ennitant connects your number and receives WhatsApp events for this shop.'
                : 'No developer needed. Connect WhatsApp and orders appear in Ennitant.'}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {connected ? (
              <Link
                to="/orders"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#12b5c9] px-5 text-[15px] font-semibold text-white shadow-sm hover:bg-[#0ea5b7]"
              >
                <Zap className="h-4 w-4" fill="currentColor" aria-hidden />
                Open orders
              </Link>
            ) : (
              <EmbeddedSignupButton
                buttonClassName="h-12 rounded-xl bg-[#12b5c9] px-5 text-[15px] font-semibold hover:bg-[#0ea5b7]"
                onConnected={onConnected}
              >
                <Zap className="h-4 w-4" fill="currentColor" aria-hidden />
                Connect WhatsApp
              </EmbeddedSignupButton>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(17rem,0.85fr)]">
          <div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-800">See it in action</p>
              <a
                href="https://developers.facebook.com/docs/whatsapp/cloud-api"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-[#128197] hover:underline"
              >
                Read the docs
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            </div>

            <div className="flex flex-wrap gap-5 border-b border-[#d7e8ef]" role="tablist" aria-label="Connection workflow">
              {WHATSAPP_GUIDE_STEPS.map((item) => {
                const active = step === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setStep(item.id)}
                    className={cn(
                      '-mb-px flex items-center gap-2 border-b-2 pb-3 text-sm font-medium',
                      active ? 'border-[#12b5c9] text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                        active ? 'bg-[#12b5c9] text-white' : 'bg-slate-200 text-slate-600',
                      )}
                    >
                      {item.number}
                    </span>
                    {item.label}
                  </button>
                )
              })}
            </div>

            <div className="mt-5 space-y-4">
              {step === 'connect' ? (
                <ConnectStep
                  connected={connected}
                  phone={phone}
                  displayName={status?.displayName}
                  onGoNext={() => setStep('webhook')}
                  onDisconnect={onDisconnect}
                  disconnecting={disconnecting}
                  onConnected={onConnected}
                />
              ) : null}
              {step === 'webhook' ? (
                <WebhookStep
                  connected={connected}
                  lastCheckedAt={status?.lastCheckedAt}
                  onCheck={onTest}
                  checking={testing}
                  onContinue={() => setStep('messages')}
                />
              ) : null}
              {step === 'messages' ? (
                <MessagesStep
                  connected={connected}
                  chatUrl={isDirect ? null : chatUrl}
                  phone={phone}
                  onTest={onTest}
                  testing={testing}
                />
              ) : null}

              <p className="text-sm leading-relaxed text-slate-500">{snippet.blurb}</p>
              <CodeSnippet method={snippet.method} endpoint={snippet.endpoint} code={snippet.code} />
              {step === 'messages' && chatUrl && connected && !isDirect ? (
                <CustomerChatQr chatUrl={chatUrl} phone={phone} embedded />
              ) : null}
            </div>
          </div>

          <aside className="space-y-8">
            <div>
              <p className="text-sm font-semibold text-slate-800">Built for developers</p>
              <ul className="mt-4 space-y-4">
                {DEVELOPER_FEATURES.map((feature) => {
                  const Icon = feature.icon
                  return (
                    <li key={feature.title} className="flex gap-3">
                      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#3aa0b8]" aria-hidden />
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{feature.title}</p>
                        <p className="text-sm text-slate-500">{feature.detail}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Pricing</p>
              <ul className="mt-4 space-y-4">
                {PRICING.map((item) => {
                  const Icon = item.icon
                  return (
                    <li key={item.title} className="flex gap-3">
                      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#3aa0b8]" aria-hidden />
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                        <p className="text-sm text-slate-500">{item.detail}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          </aside>
        </div>
      </section>

      {message ? (
        <p className="mt-4 text-sm text-emerald-700" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function ConnectStep({
  connected,
  phone,
  displayName,
  onGoNext,
  onDisconnect,
  disconnecting,
  onConnected,
}: {
  connected: boolean
  phone?: string | null
  displayName?: string | null
  onGoNext: () => void
  onDisconnect: () => void
  disconnecting?: boolean
  onConnected: () => void
}) {
  if (!connected) {
    return (
      <div className="space-y-3">
        <EmbeddedSignupButton
          buttonClassName="rounded-xl bg-[#12b5c9] hover:bg-[#0ea5b7]"
          onConnected={onConnected}
        >
          Connect WhatsApp
        </EmbeddedSignupButton>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-slate-800">
        Connected number: <span className="font-semibold">{phone || 'WhatsApp Business'}</span>
      </p>
      {displayName ? <p className="text-sm text-slate-500">{displayName}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button className="rounded-xl bg-[#12b5c9] hover:bg-[#0ea5b7]" onClick={onGoNext}>
          Keep this number
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
        <Button variant="outline" className="rounded-xl" loading={disconnecting} onClick={onDisconnect}>
          <RefreshCw className="h-4 w-4" aria-hidden />
          Change number
        </Button>
      </div>
    </div>
  )
}

function WebhookStep({
  connected,
  lastCheckedAt,
  onCheck,
  checking,
  onContinue,
}: {
  connected: boolean
  lastCheckedAt?: string | null
  onCheck: () => void
  checking?: boolean
  onContinue: () => void
}) {
  return (
    <div className="space-y-3">
      {connected ? (
        <>
          <p className="text-sm font-medium text-teal-800">
            Webhook live for this number
            {lastCheckedAt ? ` · checked ${new Date(lastCheckedAt).toLocaleString()}` : ''}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="rounded-xl" loading={checking} onClick={onCheck}>
              Check connection
            </Button>
            <Button className="rounded-xl bg-[#12b5c9] hover:bg-[#0ea5b7]" onClick={onContinue}>
              Next
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </>
      ) : (
        <p className="text-sm text-slate-500">Connect first, then Ennitant receives WhatsApp events for this shop.</p>
      )}
    </div>
  )
}

function MessagesStep({
  connected,
  chatUrl,
  phone,
  onTest,
  testing,
}: {
  connected: boolean
  chatUrl?: string | null
  phone?: string | null
  onTest: () => void
  testing?: boolean
}) {
  if (!connected) {
    return <p className="text-sm text-slate-500">Connect in step 1, then you can send a test and receive customer chats.</p>
  }

  return (
    <div className="space-y-3">
      <Button className="rounded-xl bg-[#12b5c9] hover:bg-[#0ea5b7]" loading={testing} onClick={onTest}>
        Send test
      </Button>
      {chatUrl ? <CustomerChatQr chatUrl={chatUrl} phone={phone} embedded /> : null}
    </div>
  )
}
