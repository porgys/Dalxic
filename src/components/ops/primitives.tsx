"use client"
import { ReactNode, CSSProperties, useEffect } from "react"
import { Icon, IconName } from "./Icon"

export const T = {
  bg:        "#040A0F",
  surface:   "#081410",
  surface2:  "#0A1A14",
  border:    "rgba(16,185,129,0.10)",
  border2:   "rgba(16,185,129,0.18)",
  emerald:   "#10B981",
  emeraldL:  "#34D399",
  amber:     "#F59E0B",
  amberL:    "#FBBF24",
  sky:       "#0EA5E9",
  copper:    "#D97706",
  copperL:   "#E69A2E",
  tx:        "#ECF5F0",
  txM:       "#6B9B8A",
  txD:       "#3A6B5A",
  red:       "#EF4444",
}

const ACCENT_RGB: Record<string, string> = {
  emerald: "16,185,129",
  amber:   "245,158,11",
  sky:     "14,165,233",
  copper:  "217,119,6",
}

type Accent = "emerald" | "amber" | "sky" | "copper"

function accentColor(a: Accent) {
  return a === "amber" ? T.amber : a === "sky" ? T.sky : a === "copper" ? T.copper : T.emerald
}

/* ───── Layout ───── */

export function Page({ children, title, subtitle, accent = "emerald", action }: {
  children: ReactNode
  title: string
  subtitle?: string
  accent?: Accent
  action?: ReactNode
}) {
  const c = accentColor(accent)
  const label = accent === "copper" ? "DalxicHealth" : accent === "sky" ? "DalxicInstitute" : accent === "amber" ? "DalxicTrade" : "DalxicOperations"
  return (
    <div style={{ minHeight: "calc(100vh - 56px)", background: T.bg, padding: "32px 32px 80px", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 1480, margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28, gap: 24 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 700, color: c, marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>
              {label}
            </div>
            <h1 style={{ fontSize: 36, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.02em", lineHeight: 1.05 }}>
              {title}
            </h1>
            {subtitle && <p style={{ fontSize: 14, color: T.txM, marginTop: 8, maxWidth: 720 }}>{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </header>
        {children}
      </div>
    </div>
  )
}

/* ───── Glass card ───── */

export function Card({ children, padding = 24, style, hover = false, accent = "emerald" }: {
  children: ReactNode
  padding?: number | string
  style?: CSSProperties
  hover?: boolean
  accent?: Accent
}) {
  const c = ACCENT_RGB[accent] ?? ACCENT_RGB.emerald
  return (
    <div
      style={{
        background: `rgba(${c},0.03)`,
        border: `1px solid rgba(${c},0.10)`,
        borderRadius: 16,
        padding,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        transition: hover ? "border-color 0.2s, transform 0.2s" : undefined,
        ...style,
      }}
      onMouseEnter={hover ? (e) => { (e.currentTarget as HTMLDivElement).style.borderColor = `rgba(${c},0.25)` } : undefined}
      onMouseLeave={hover ? (e) => { (e.currentTarget as HTMLDivElement).style.borderColor = `rgba(${c},0.10)` } : undefined}
    >
      {children}
    </div>
  )
}

/* ───── KPI Stat ───── */

export function Stat({ label, value, sub, accent = "emerald", icon }: {
  label: string
  value: string | number
  sub?: string
  accent?: Accent | "neutral"
  icon?: IconName
}) {
  const color = accent === "neutral" ? T.tx : accentColor(accent as Accent)
  const cardAccent: Accent = accent === "neutral" ? "emerald" : accent as Accent
  return (
    <Card accent={cardAccent}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, color: T.txD, fontFamily: "'DM Mono', monospace" }}>
          {label}
        </div>
        {icon && (
          <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center", color }}>
            <Icon name={icon} size={14} />
          </div>
        )}
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.02em", lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: T.txM, marginTop: 8 }}>{sub}</div>}
    </Card>
  )
}

/* ───── Status pill ───── */

export type Tone = "emerald" | "amber" | "sky" | "copper" | "red" | "neutral"

export function Pill({ tone = "emerald", children, dot = false }: { tone?: Tone; children: ReactNode; dot?: boolean }) {
  const colors: Record<Tone, string> = {
    emerald: T.emerald, amber: T.amber, sky: T.sky, copper: T.copper, red: T.red, neutral: T.txM,
  }
  const c = colors[tone]
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 10px", borderRadius: 999,
      fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
      color: c, background: `${c}10`, border: `1px solid ${c}25`,
      fontFamily: "'DM Mono', monospace",
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: c }} />}
      {children}
    </span>
  )
}

/* ───── Buttons ───── */

export function Button({ children, onClick, variant = "primary", size = "md", icon, disabled, type = "button", full = false }: {
  children?: ReactNode
  onClick?: () => void
  variant?: "primary" | "ghost" | "outline" | "danger"
  size?: "sm" | "md" | "lg"
  icon?: IconName
  disabled?: boolean
  type?: "button" | "submit"
  full?: boolean
}) {
  const sizes = {
    sm: { padding: "7px 14px", fontSize: 11 },
    md: { padding: "10px 20px", fontSize: 12 },
    lg: { padding: "14px 28px", fontSize: 13 },
  }
  const variants: Record<string, CSSProperties> = {
    primary: { background: `linear-gradient(135deg, ${T.emerald}, #059669)`, color: "#fff", border: "none", boxShadow: `0 4px 16px ${T.emerald}25` },
    ghost:   { background: "transparent", color: T.txM, border: `1px solid ${T.border}` },
    outline: { background: "transparent", color: T.emeraldL, border: `1px solid ${T.border2}` },
    danger:  { background: `linear-gradient(135deg, ${T.red}, #DC2626)`, color: "#fff", border: "none", boxShadow: `0 4px 16px ${T.red}25` },
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...sizes[size],
        ...variants[variant],
        borderRadius: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1,
        fontFamily: "'DM Sans', sans-serif",
        display: "inline-flex", alignItems: "center", gap: 8, justifyContent: "center",
        width: full ? "100%" : undefined,
        transition: "transform 0.1s",
      }}
      onMouseDown={(e) => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.98)" }}
      onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)" }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)" }}
    >
      {icon && <Icon name={icon} size={size === "sm" ? 12 : size === "lg" ? 16 : 14} />}
      {children}
    </button>
  )
}

/* ───── Inputs ───── */

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label style={{ display: "block", marginBottom: 16 }}>
      <span style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: T.txD, marginBottom: 6, fontFamily: "'DM Mono', monospace" }}>
        {label}
      </span>
      {children}
      {hint && <span style={{ display: "block", fontSize: 10, color: T.txM, marginTop: 4 }}>{hint}</span>}
    </label>
  )
}

const inputBase: CSSProperties = {
  width: "100%", padding: "11px 14px", borderRadius: 10, fontSize: 13,
  background: "rgba(255,255,255,0.03)", border: `1px solid rgba(16,185,129,0.18)`,
  color: "#ECF5F0", outline: "none", fontFamily: "'DM Sans', sans-serif",
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...inputBase, ...(props.style as CSSProperties) }} />
}
export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} style={{ ...inputBase, minHeight: 96, resize: "vertical", ...(props.style as CSSProperties) }} />
}
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} style={{ ...inputBase, ...(props.style as CSSProperties) }} />
}

/* ───── Search bar ───── */

export function SearchBar({ value, onChange, placeholder = "Search\u2026" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div style={{ position: "relative" }}>
      <Icon name="search" size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: T.txD }} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{ ...inputBase, paddingLeft: 38 }} />
    </div>
  )
}

/* ───── Data table ───── */

export interface Column<R> {
  key: string
  label: string
  render: (row: R) => ReactNode
  width?: string | number
  align?: "left" | "right" | "center"
}

export function DataTable<R extends { id?: string }>({ rows, columns, empty = "Nothing here yet.", onRowClick }: {
  rows: R[]
  columns: Column<R>[]
  empty?: string
  onRowClick?: (row: R) => void
}) {
  if (rows.length === 0) {
    return (
      <Card style={{ textAlign: "center", padding: 48 }}>
        <div style={{ fontSize: 13, color: T.txM }}>{empty}</div>
      </Card>
    )
  }
  return (
    <Card padding={0} style={{ overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'DM Sans', sans-serif" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
              {columns.map((c) => (
                <th key={c.key} style={{
                  padding: "14px 18px",
                  fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
                  color: T.txD, textAlign: c.align ?? "left", width: c.width,
                  fontFamily: "'DM Mono', monospace",
                }}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id ?? idx}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                style={{
                  borderBottom: idx === rows.length - 1 ? "none" : `1px solid ${T.border}`,
                  cursor: onRowClick ? "pointer" : undefined,
                  transition: "background 0.15s",
                }}
                onMouseEnter={onRowClick ? (e) => { (e.currentTarget as HTMLTableRowElement).style.background = "rgba(16,185,129,0.04)" } : undefined}
                onMouseLeave={onRowClick ? (e) => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent" } : undefined}
              >
                {columns.map((c) => (
                  <td key={c.key} style={{ padding: "14px 18px", fontSize: 13, color: T.tx, textAlign: c.align ?? "left" }}>
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

/* ───── Modal ───── */

export function Modal({ open, onClose, title, children, width = 560 }: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  width?: number
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(4,10,15,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 100, backdropFilter: "blur(8px)", padding: 20,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "100%", maxWidth: width, maxHeight: "90vh", overflowY: "auto",
        background: T.surface, border: `1px solid ${T.border2}`,
        borderRadius: 18, boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: `1px solid ${T.border}` }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: T.tx, fontFamily: "'Space Grotesk', sans-serif" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: T.txM, padding: 4, display: "flex" }}>
            <Icon name="close" size={18} />
          </button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  )
}

/* ───── Drawer (right side) ───── */

export function Drawer({ open, onClose, title, subtitle, children, width = 480, footer }: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: ReactNode
  children: ReactNode
  width?: number
  footer?: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])
  return (
    <>
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, background: "rgba(4,10,15,0.6)",
        zIndex: 90, backdropFilter: "blur(4px)",
        opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none",
        transition: "opacity 0.25s",
      }} />
      <div style={{
        position: "fixed", top: 0, right: 0, height: "100vh", width,
        background: T.surface, borderLeft: `1px solid ${T.border2}`,
        zIndex: 91, display: "flex", flexDirection: "column",
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.28s ease",
        boxShadow: "-24px 0 48px rgba(0,0,0,0.45)",
      }}>
        <div style={{ padding: "24px 28px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.01em" }}>{title}</h3>
              {subtitle && <p style={{ fontSize: 12, color: T.txM, marginTop: 4 }}>{subtitle}</p>}
            </div>
            <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: T.txM, padding: 4, display: "flex" }}>
              <Icon name="close" size={18} />
            </button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 28 }}>{children}</div>
        {footer && (
          <div style={{ padding: "20px 28px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "flex-end", gap: 10 }}>
            {footer}
          </div>
        )}
      </div>
    </>
  )
}

/* ───── Section header ───── */

export function Section({ title, sub, action, children }: { title: string; sub?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.01em" }}>{title}</h2>
          {sub && <p style={{ fontSize: 12, color: T.txM, marginTop: 2 }}>{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

/* ───── Empty state ───── */

export function Empty({ icon = "search", title, sub, action }: { icon?: IconName; title: string; sub?: string; action?: ReactNode }) {
  return (
    <Card style={{ textAlign: "center", padding: 64 }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: `${T.emerald}10`, display: "inline-flex", alignItems: "center", justifyContent: "center", color: T.emerald, marginBottom: 16 }}>
        <Icon name={icon} size={24} />
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", marginBottom: 6 }}>{title}</h3>
      {sub && <p style={{ fontSize: 13, color: T.txM, maxWidth: 360, margin: "0 auto 20px" }}>{sub}</p>}
      {action}
    </Card>
  )
}

/* ───── Tab strip ───── */

export function Tabs<V extends string>({ tabs, value, onChange, accent = "emerald" }: {
  tabs: { key: V; label: string; icon?: IconName; count?: number }[]
  value: V
  onChange: (v: V) => void
  accent?: Accent
}) {
  const c = accentColor(accent)
  return (
    <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${T.border}`, marginBottom: 24 }}>
      {tabs.map((t) => {
        const active = value === t.key
        return (
          <button key={t.key} onClick={() => onChange(t.key)} style={{
            padding: "12px 18px", background: "transparent", border: "none",
            borderBottom: `2px solid ${active ? c : "transparent"}`,
            color: active ? c : T.txM, fontWeight: active ? 700 : 600, fontSize: 13,
            cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8,
            fontFamily: "'DM Sans', sans-serif", transition: "color 0.15s",
            marginBottom: -1,
          }}>
            {t.icon && <Icon name={t.icon} size={14} />}
            {t.label}
            {t.count !== undefined && (
              <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 999, background: active ? `${c}15` : T.surface2, color: active ? c : T.txD, fontFamily: "'DM Mono', monospace" }}>{t.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
