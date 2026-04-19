"use client"
/* ═══════════════════════════════════════════════════════════════
   OPS SHELL — Master operations layout.
   Sidebar + top bar. Emerald platform identity.
   Used for every /ops/* route.
   ═══════════════════════════════════════════════════════════════ */
import { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Icon, IconName } from "./Icon"
import { T } from "./primitives"

const NAV: { group: string; items: { href: string; label: string; icon: IconName }[] }[] = [
  {
    group: "Overview",
    items: [
      { href: "/ops",           label: "Command",     icon: "dashboard" },
      { href: "/ops/analytics", label: "Analytics",   icon: "trending" },
    ],
  },
  {
    group: "Customers",
    items: [
      { href: "/ops/tenants",  label: "Tenants",   icon: "tenants" },
      { href: "/ops/partners", label: "Partners",  icon: "partners" },
      { href: "/ops/support",  label: "Support",   icon: "support" },
    ],
  },
  {
    group: "Catalog",
    items: [
      { href: "/ops/tiers",   label: "Tiers",    icon: "tiers" },
      { href: "/ops/modules", label: "Modules",  icon: "modules" },
      { href: "/ops/addons",  label: "Add-ons",  icon: "addons" },
    ],
  },
  {
    group: "Revenue",
    items: [
      { href: "/ops/billing", label: "Billing",   icon: "billing" },
    ],
  },
  {
    group: "Platform",
    items: [
      { href: "/ops/staff",      label: "Staff",       icon: "staff" },
      { href: "/ops/releases",   label: "Releases",    icon: "releases" },
      { href: "/ops/infra",      label: "Infra",       icon: "infra" },
      { href: "/ops/compliance", label: "Compliance",  icon: "compliance" },
      { href: "/ops/audit",      label: "Audit",       icon: "audit" },
      { href: "/ops/settings",   label: "Settings",    icon: "settings" },
    ],
  },
]

export function OpsShell({ children }: { children: ReactNode }) {
  return (
    <div style={{ background: T.bg, color: T.tx, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", display: "flex" }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 240, minWidth: 0 }}>
        <TopBar />
        {children}
      </div>
    </div>
  )
}

function TopBar() {
  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 30,
      padding: "12px 28px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: "rgba(4,10,15,0.92)",
      backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
      borderBottom: `1px solid ${T.border}`,
      transform: "translateZ(0)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{
          fontSize: 10, color: T.txD,
          padding: "6px 10px", borderRadius: 8,
          border: `1px solid ${T.border}`,
          fontFamily: "'DM Mono', monospace",
          letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700,
        }}>
          Master Control
        </div>
        <div style={{ fontSize: 11, color: T.txM, fontFamily: "'DM Mono', monospace" }}>
          Platform-wide · All tenants · All verticals
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link href="/" style={{
          fontSize: 11, color: T.txM, textDecoration: "none",
          padding: "7px 12px", borderRadius: 8, border: `1px solid ${T.border}`,
          display: "inline-flex", alignItems: "center", gap: 6,
          fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase",
        }}>
          <Icon name="globe" size={12} />
          Public Site
        </Link>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "6px 12px", borderRadius: 8,
          background: `${T.emerald}08`, border: `1px solid ${T.border}`,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.emerald, display: "inline-block", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: T.emerald }}>All Systems Operational</span>
        </div>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "6px 10px 6px 8px", borderRadius: 999,
          background: T.surface2, border: `1px solid ${T.border}`,
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: "50%",
            background: `linear-gradient(135deg, ${T.emerald}, #059669)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 800, color: "#fff", fontFamily: "'DM Mono', monospace",
          }}>GG</div>
          <span style={{ fontSize: 11, fontWeight: 600, color: T.tx, fontFamily: "'DM Mono', monospace" }}>George Gaisie</span>
          <span style={{ fontSize: 9, color: T.txD, fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase" }}>· Founder</span>
        </div>
      </div>
    </div>
  )
}

function Sidebar() {
  const pathname = usePathname()
  return (
    <aside style={{
      position: "fixed", top: 0, left: 0, bottom: 0, width: 240,
      background: "#02070A",
      borderRight: `1px solid ${T.border}`,
      padding: "20px 14px 24px",
      overflowY: "auto",
      zIndex: 40,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <Link href="/ops" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28, padding: "4px 10px", textDecoration: "none" }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: `linear-gradient(135deg, ${T.emerald}, #059669)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 6px 20px ${T.emerald}40`,
        }}>
          <Icon name="bolt" size={16} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.01em", lineHeight: 1 }}>
            DalxicOps
          </div>
          <div style={{ fontSize: 9, color: T.emerald, fontFamily: "'DM Mono', monospace", letterSpacing: "0.14em", textTransform: "uppercase", marginTop: 3, fontWeight: 700 }}>
            Master
          </div>
        </div>
      </Link>

      {NAV.map((group) => (
        <div key={group.group} style={{ marginBottom: 18 }}>
          <div style={{
            fontSize: 9, color: T.txD, fontFamily: "'DM Mono', monospace",
            letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700,
            padding: "0 10px", marginBottom: 6,
          }}>
            {group.group}
          </div>
          {group.items.map((item) => {
            const active = pathname === item.href || (item.href !== "/ops" && pathname?.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 10px", borderRadius: 8,
                color: active ? T.emerald : T.txM,
                background: active ? `${T.emerald}10` : "transparent",
                fontSize: 12, fontWeight: active ? 700 : 500,
                textDecoration: "none",
                transition: "background 0.15s, color 0.15s",
                marginBottom: 2,
                borderLeft: active ? `2px solid ${T.emerald}` : "2px solid transparent",
                paddingLeft: active ? 8 : 10,
              }}>
                <Icon name={item.icon} size={14} />
                {item.label}
              </Link>
            )
          })}
        </div>
      ))}

      <div style={{
        marginTop: 28, padding: 14,
        background: `${T.emerald}08`, borderRadius: 12,
        border: `1px solid ${T.emerald}22`,
      }}>
        <div style={{ fontSize: 9, color: T.emerald, fontFamily: "'DM Mono', monospace", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>
          Verticals
        </div>
        <Link href="/trade" style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", color: T.amber, fontSize: 11, fontWeight: 700, textDecoration: "none" }}>
          <Icon name="pos" size={12} /> DalxicTrade →
        </Link>
        <Link href="/health" style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", color: T.copper, fontSize: 11, fontWeight: 700, textDecoration: "none" }}>
          <Icon name="support" size={12} /> DalxicHealth →
        </Link>
        <Link href="/institute" style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", color: T.sky, fontSize: 11, fontWeight: 700, textDecoration: "none" }}>
          <Icon name="customers" size={12} /> DalxicInstitute →
        </Link>
      </div>
    </aside>
  )
}

/* ───── Page helper — mirrors Trade's Page but scoped to master ops ───── */

export function OpsPage({ children, title, subtitle, action, icon }: {
  children: ReactNode
  title: string
  subtitle?: string
  action?: ReactNode
  icon?: IconName
}) {
  return (
    <div style={{ minHeight: "calc(100vh - 56px)", background: T.bg, padding: "32px 32px 80px", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 1480, margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28, gap: 24 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 700, color: T.emerald, marginBottom: 8, fontFamily: "'DM Mono', monospace", display: "flex", alignItems: "center", gap: 8 }}>
              {icon && <Icon name={icon} size={12} />}
              DalxicOperations · Master
            </div>
            <h1 style={{ fontSize: 38, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.02em", lineHeight: 1.05 }}>
              {title}
            </h1>
            {subtitle && <p style={{ fontSize: 14, color: T.txM, marginTop: 8, maxWidth: 760 }}>{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </header>
        {children}
      </div>
    </div>
  )
}
