export const GHS = "GHS"

export function money(value: number | null | undefined, opts: { compact?: boolean; symbol?: boolean } = {}): string {
  const v = value ?? 0
  if (opts.compact) {
    if (Math.abs(v) >= 1_000_000) return `${opts.symbol === false ? "" : "GHS "}${(v / 1_000_000).toFixed(1)}M`
    if (Math.abs(v) >=     1_000) return `${opts.symbol === false ? "" : "GHS "}${(v /     1_000).toFixed(1)}K`
  }
  const formatted = v.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return opts.symbol === false ? formatted : `GHS ${formatted}`
}

export function moneyShort(value: number | null | undefined): string {
  return money(value, { compact: true })
}

export function dateShort(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

export function dateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
}

export function relativeDays(iso: string): string {
  const ms = Date.now() - new Date(iso.replace(" ", "T")).getTime()
  const days = Math.floor(ms / 86400000)
  if (days < 1) return "Today"
  if (days < 2) return "Yesterday"
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

export function pct(value: number, total: number): string {
  if (total === 0) return "0%"
  return `${((value / total) * 100).toFixed(1)}%`
}
