import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export function CodeSnippet({
  method,
  endpoint,
  code,
}: {
  method?: string
  endpoint?: string
  code: string
}) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-xl bg-[#0b1220] text-left shadow-inner">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2.5">
        <p className="truncate font-mono text-xs text-slate-300">
          {method ? <span className="mr-2 font-semibold text-cyan-400">{method}</span> : null}
          <span className="text-slate-400">{endpoint}</span>
        </p>
        <button
          type="button"
          className="shrink-0 rounded p-1 text-slate-400 transition hover:text-white focus-ring"
          aria-label={copied ? 'Copied' : 'Copy example'}
          onClick={() => void copy()}
        >
          {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[11px] leading-relaxed text-slate-100 sm:text-xs">
        <code>{code}</code>
      </pre>
    </div>
  )
}
