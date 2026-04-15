"use client"
/* ═══════════════════════════════════════════════════════════════
   /trade/loyalty — Tiers, members, promotions
   ═══════════════════════════════════════════════════════════════ */
import { useState, useMemo } from "react"
import { Shell } from "@/components/ops/Shell"
import {
  Page, Card, Stat, Pill, Button, DataTable, Drawer, Field, Input, Select,
  SearchBar, Tabs, Section, Empty, T, Tone, Column,
} from "@/components/ops/primitives"
import { Icon } from "@/components/ops/Icon"
import {
  MOCK_TIERS, MockLoyaltyTier,
  MOCK_MEMBERS, MockLoyaltyMember,
  MOCK_PROMOS, MockPromo, PromoType,
} from "@/lib/ops/mock"
import { money, dateShort } from "@/lib/ops/format"

type View = "tiers" | "members" | "promos"

const PROMO_TONE: Record<MockPromo["status"], Tone> = {
  scheduled: "sky", live: "emerald", ended: "neutral", paused: "amber",
}

const TIER_TONE: Record<MockLoyaltyMember["tier"], Tone> = {
  Bronze: "neutral", Silver: "sky", Gold: "amber", Platinum: "emerald",
}

export default function LoyaltyPage() {
  return <Shell><LoyaltyView /></Shell>
}

function LoyaltyView() {
  const [view, setView] = useState<View>("tiers")
  const [query, setQuery] = useState("")
  const [activeMember, setActiveMember] = useState<MockLoyaltyMember | null>(null)
  const [activePromo, setActivePromo] = useState<MockPromo | null>(null)
  const [activeTier, setActiveTier] = useState<MockLoyaltyTier | null>(null)
  const [showNewPromo, setShowNewPromo] = useState(false)

  const totals = useMemo(() => {
    const totalMembers = MOCK_TIERS.reduce((a, t) => a + t.members, 0)
    const promoRev = MOCK_PROMOS.filter(p => p.status === "live" || p.status === "ended").reduce((a, p) => a + p.revenue, 0)
    const livePromos = MOCK_PROMOS.filter(p => p.status === "live").length
    const totalPoints = MOCK_MEMBERS.reduce((a, m) => a + m.points, 0)
    return { totalMembers, promoRev, livePromos, totalPoints }
  }, [])

  /* ───── Members ───── */
  const memberRows = useMemo(() => {
    if (!query) return MOCK_MEMBERS
    const q = query.toLowerCase()
    return MOCK_MEMBERS.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.phone.toLowerCase().includes(q) ||
      m.tier.toLowerCase().includes(q)
    )
  }, [query])

  const memberCols: Column<MockLoyaltyMember>[] = [
    { key: "name", label: "Member", render: (m) => (
      <div>
        <div style={{ fontWeight: 700, color: T.tx }}>{m.name}</div>
        <div style={{ fontSize: 11, color: T.txM, marginTop: 2, fontFamily: "'DM Mono', monospace" }}>{m.phone}</div>
      </div>
    )},
    { key: "tier", label: "Tier", width: 110, render: (m) => <Pill tone={TIER_TONE[m.tier]} dot>{m.tier}</Pill> },
    { key: "points", label: "Points", width: 110, align: "right", render: (m) => (
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, color: T.amber }}>{m.points.toLocaleString()}</span>
    )},
    { key: "spend", label: "Spend YTD", width: 130, align: "right", render: (m) => (
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: T.emerald }}>{money(m.spendYTD, { compact: true })}</span>
    )},
    { key: "joined", label: "Joined", width: 110, render: (m) => dateShort(m.joined) },
    { key: "last", label: "Last Visit", width: 110, render: (m) => dateShort(m.lastVisit) },
  ]

  /* ───── Promos ───── */
  const promoRows = useMemo(() => {
    if (!query) return MOCK_PROMOS
    const q = query.toLowerCase()
    return MOCK_PROMOS.filter(p =>
      p.code.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.scope.toLowerCase().includes(q)
    )
  }, [query])

  const promoCols: Column<MockPromo>[] = [
    { key: "code", label: "Code", width: 130, render: (p) => (
      <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 800, color: T.amber, letterSpacing: "0.06em" }}>{p.code}</span>
    )},
    { key: "name", label: "Promotion", render: (p) => (
      <div>
        <div style={{ fontWeight: 600, color: T.tx }}>{p.name}</div>
        <div style={{ fontSize: 11, color: T.txM, marginTop: 2 }}>{p.scope}</div>
      </div>
    )},
    { key: "type", label: "Type", width: 130, render: (p) => <Pill tone="sky">{p.type}</Pill> },
    { key: "window", label: "Window", width: 180, render: (p) => (
      <span style={{ fontSize: 12, color: T.txM, fontFamily: "'DM Mono', monospace" }}>
        {dateShort(p.startDate)} → {dateShort(p.endDate)}
      </span>
    )},
    { key: "used", label: "Used", width: 110, align: "right", render: (p) => (
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: T.tx }}>
        {p.used}{p.cap ? ` / ${p.cap}` : ""}
      </span>
    )},
    { key: "rev", label: "Revenue", width: 120, align: "right", render: (p) => (
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: T.emerald }}>{money(p.revenue, { compact: true })}</span>
    )},
    { key: "status", label: "Status", width: 130, render: (p) => <Pill tone={PROMO_TONE[p.status]} dot>{p.status}</Pill> },
  ]

  return (
    <>
      <Page
        title="Loyalty & Promotions"
        subtitle="Tier your customers, reward their spend, and run promos that pull them back through the door."
        accent="amber"
        action={view === "promos"
          ? <Button icon="plus" onClick={() => setShowNewPromo(true)}>New Promotion</Button>
          : <Button icon="plus" onClick={() => setShowNewPromo(true)}>New Promotion</Button>}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Total Members"     value={totals.totalMembers.toLocaleString()}            accent="emerald" icon="customers" />
          <Stat label="Active Promos"     value={totals.livePromos}                                accent="amber"   icon="loyalty" />
          <Stat label="Promo Revenue YTD" value={money(totals.promoRev, { compact: true })}      accent="sky"     icon="financials" />
          <Stat label="Outstanding Points"value={totals.totalPoints.toLocaleString()}            accent="amber"   icon="loyalty" />
        </div>

        <Section
          title={view === "tiers" ? "Loyalty Tiers" : view === "members" ? "Members" : "Promotions"}
          sub={
            view === "tiers"   ? "Stake the ladder. Members move up automatically when spend crosses the threshold." :
            view === "members" ? "Top spenders, points balances, last seen." :
            "Discount engines — codes, bundles, BOGOFs. Schedule once, runs forever."
          }
          action={
            <div style={{ width: 280 }}>
              <SearchBar value={query} onChange={setQuery} placeholder="Search…" />
            </div>
          }
        >
          <Tabs<View>
            value={view}
            onChange={(v) => { setView(v); setQuery("") }}
            accent="amber"
            tabs={[
              { key: "tiers",   label: "Tiers",   count: MOCK_TIERS.length },
              { key: "members", label: "Members", count: MOCK_MEMBERS.length },
              { key: "promos",  label: "Promos",  count: MOCK_PROMOS.length },
            ]}
          />

          {view === "tiers" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14, marginTop: 14 }}>
              {MOCK_TIERS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTier(t)}
                  style={{
                    appearance: "none", textAlign: "left", cursor: "pointer",
                    padding: 22, borderRadius: 14,
                    background: `linear-gradient(140deg, ${t.color}1A, transparent 70%)`,
                    border: `1px solid ${t.color}40`,
                    backdropFilter: "blur(16px)",
                    transition: "transform 0.18s ease, box-shadow 0.18s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 12px 30px ${t.color}30` }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: t.color, fontFamily: "'DM Mono', monospace" }}>
                      Tier
                    </div>
                    <Icon name="loyalty" size={22} color={t.color} />
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: t.color, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.02em", marginBottom: 4 }}>
                    {t.name}
                  </div>
                  <div style={{ fontSize: 12, color: T.txM, marginBottom: 18 }}>{t.perkLine}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
                    <div>
                      <div style={{ fontSize: 9, color: T.txD, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>Min Spend</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.tx, marginTop: 2, fontFamily: "'Space Grotesk', sans-serif" }}>{money(t.minSpend, { compact: true })}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 9, color: T.txD, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>Members</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.tx, marginTop: 2, fontFamily: "'Space Grotesk', sans-serif" }}>{t.members}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {view === "members" && (
            memberRows.length === 0
              ? <Empty icon="customers" title="No members match" />
              : <DataTable rows={memberRows} columns={memberCols} onRowClick={(m) => setActiveMember(m)} />
          )}

          {view === "promos" && (
            promoRows.length === 0
              ? <Empty icon="loyalty" title="No promotions match" />
              : <DataTable rows={promoRows} columns={promoCols} onRowClick={(p) => setActivePromo(p)} />
          )}
        </Section>
      </Page>

      <TierDrawer tier={activeTier} onClose={() => setActiveTier(null)} />
      <MemberDrawer member={activeMember} onClose={() => setActiveMember(null)} />
      <PromoDrawer promo={activePromo} onClose={() => setActivePromo(null)} />
      <NewPromoDrawer open={showNewPromo} onClose={() => setShowNewPromo(false)} />
    </>
  )
}

/* ─────────────────────────────  TIER DRAWER  ───────────────────────────── */
function TierDrawer({ tier, onClose }: { tier: MockLoyaltyTier | null; onClose: () => void }) {
  if (!tier) return <Drawer open={false} onClose={onClose} title="Tier">{null}</Drawer>
  const sample = MOCK_MEMBERS.filter(m => m.tier === tier.name).slice(0, 6)
  return (
    <Drawer
      open={!!tier} onClose={onClose}
      title={tier.name}
      subtitle={`${tier.members} members · ${tier.earnRate} pts per GHS`}
      width={500}
      footer={<Button icon="edit">Edit Tier</Button>}
    >
      <Card padding={20} style={{ marginBottom: 20, background: `linear-gradient(140deg, ${tier.color}1A, transparent 70%)`, border: `1px solid ${tier.color}40` }}>
        <div style={{ fontSize: 11, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>Tier Perks</div>
        <div style={{ fontSize: 14, color: T.tx, lineHeight: 1.6 }}>{tier.perkLine}</div>
      </Card>

      <Section title="Configuration">
        <Card padding={20}>
          <RowKV label="Minimum spend (YTD)" value={money(tier.minSpend)} />
          <RowKV label="Earn rate" value={`${tier.earnRate} pts per GHS 1`} />
          <RowKV label="Active members" value={tier.members.toString()} last />
        </Card>
      </Section>

      <Section title={`Sample ${tier.name} Members`}>
        <Card padding={0}>
          {sample.length === 0
            ? <div style={{ padding: 20, fontSize: 12, color: T.txM, textAlign: "center" }}>No members in this tier yet.</div>
            : sample.map((m, i) => (
              <div key={m.id} style={{ display: "flex", justifyContent: "space-between", padding: "14px 20px", borderBottom: i === sample.length - 1 ? "none" : `1px solid ${T.border}` }}>
                <div>
                  <div style={{ fontWeight: 600, color: T.tx, fontSize: 13 }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: T.txM, marginTop: 2, fontFamily: "'DM Mono', monospace" }}>{m.phone}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, color: T.amber, fontFamily: "'Space Grotesk', sans-serif", fontSize: 13 }}>{m.points} pts</div>
                  <div style={{ fontSize: 11, color: T.txM, marginTop: 2 }}>{money(m.spendYTD, { compact: true })} YTD</div>
                </div>
              </div>
            ))}
        </Card>
      </Section>
    </Drawer>
  )
}

/* ─────────────────────────────  MEMBER DRAWER  ───────────────────────────── */
function MemberDrawer({ member, onClose }: { member: MockLoyaltyMember | null; onClose: () => void }) {
  if (!member) return <Drawer open={false} onClose={onClose} title="Member">{null}</Drawer>
  return (
    <Drawer
      open={!!member} onClose={onClose}
      title={member.name}
      subtitle={`${member.tier} member · since ${dateShort(member.joined)}`}
      width={520}
      footer={
        <>
          <Button variant="ghost" icon="whatsapp">Message</Button>
          <Button variant="outline" icon="orders">View Receipts</Button>
          <Button icon="edit">Edit</Button>
        </>
      }
    >
      <Card padding={20} accent="amber" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <Pill tone={TIER_TONE[member.tier]} dot>{member.tier}</Pill>
            <div style={{ fontSize: 32, fontWeight: 800, color: T.amber, fontFamily: "'Space Grotesk', sans-serif", marginTop: 12, lineHeight: 1, letterSpacing: "-0.02em" }}>
              {member.points.toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: T.txD, marginTop: 4, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>Points</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: T.txM }}>YTD Spend</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.emerald, marginTop: 2, fontFamily: "'Space Grotesk', sans-serif" }}>
              {money(member.spendYTD, { compact: true })}
            </div>
          </div>
        </div>
      </Card>

      <Section title="Contact">
        <Card padding={20}>
          <RowKV label="Name" value={member.name} />
          <RowKV label="Phone" value={member.phone} mono />
          <RowKV label="Tier" value={member.tier} />
          <RowKV label="Joined" value={dateShort(member.joined)} />
          <RowKV label="Last visit" value={dateShort(member.lastVisit)} last />
        </Card>
      </Section>
    </Drawer>
  )
}

/* ─────────────────────────────  PROMO DRAWER  ───────────────────────────── */
function PromoDrawer({ promo, onClose }: { promo: MockPromo | null; onClose: () => void }) {
  if (!promo) return <Drawer open={false} onClose={onClose} title="Promotion">{null}</Drawer>
  const pct = promo.cap ? Math.min(100, (promo.used / promo.cap) * 100) : 0
  return (
    <Drawer
      open={!!promo} onClose={onClose}
      title={promo.name}
      subtitle={`${promo.code} · ${promo.scope}`}
      width={540}
      footer={
        promo.status === "live" ? (
          <>
            <Button variant="ghost" icon="close">Pause</Button>
            <Button icon="edit">Edit</Button>
          </>
        ) : promo.status === "scheduled" ? (
          <>
            <Button variant="ghost" icon="trash">Cancel</Button>
            <Button icon="edit">Edit</Button>
          </>
        ) : (
          <Button variant="ghost" icon="share">Duplicate</Button>
        )
      }
    >
      <Card padding={20} accent="amber" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <Pill tone={PROMO_TONE[promo.status]} dot>{promo.status}</Pill>
            <div style={{ fontSize: 28, fontWeight: 800, color: T.amber, fontFamily: "'Space Grotesk', sans-serif", marginTop: 12, lineHeight: 1, letterSpacing: "-0.02em" }}>
              {money(promo.revenue, { compact: true })}
            </div>
            <div style={{ fontSize: 11, color: T.txD, marginTop: 4, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>Revenue Generated</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: T.txM }}>Redemptions</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.tx, marginTop: 2, fontFamily: "'Space Grotesk', sans-serif" }}>
              {promo.used}{promo.cap ? ` / ${promo.cap}` : ""}
            </div>
          </div>
        </div>
        {promo.cap && (
          <div style={{ marginTop: 16 }}>
            <div style={{ height: 6, borderRadius: 3, background: T.border, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: T.amber }} />
            </div>
            <div style={{ fontSize: 10, color: T.txD, marginTop: 6, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
              {pct.toFixed(0)}% of cap used
            </div>
          </div>
        )}
      </Card>

      <Section title="Configuration">
        <Card padding={20}>
          <RowKV label="Code" value={promo.code} mono />
          <RowKV label="Type" value={promo.type} />
          <RowKV label="Scope" value={promo.scope} />
          <RowKV label="Starts" value={dateShort(promo.startDate)} />
          <RowKV label="Ends" value={dateShort(promo.endDate)} />
          <RowKV label="Cap" value={promo.cap ? `${promo.cap} redemptions` : "Unlimited"} last />
        </Card>
      </Section>
    </Drawer>
  )
}

function RowKV({ label, value, mono = false, last = false }: { label: string; value: React.ReactNode; mono?: boolean; last?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: last ? "none" : `1px solid ${T.border}` }}>
      <span style={{ fontSize: 12, color: T.txM }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: T.tx, fontFamily: mono ? "'DM Mono', monospace" : "'Space Grotesk', sans-serif" }}>{value}</span>
    </div>
  )
}

/* ─────────────────────────────  NEW PROMO DRAWER  ───────────────────────────── */
function NewPromoDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [type, setType] = useState<PromoType>("Percent Off")
  const [scope, setScope] = useState("")
  const [start, setStart] = useState("2026-04-15")
  const [end, setEnd] = useState("2026-04-30")
  const [cap, setCap] = useState("")
  return (
    <Drawer
      open={open} onClose={onClose}
      title="New Promotion"
      subtitle="Configure the rule once. POS will apply it automatically when conditions match."
      width={520}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button icon="check" onClick={onClose}>Schedule Promo</Button>
        </>
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 14 }}>
        <Field label="Code *">
          <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="EASTER25" />
        </Field>
        <Field label="Name *">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Easter Sunday — 25% off snacks" />
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Type *">
          <Select value={type} onChange={(e) => setType(e.target.value as PromoType)}>
            {(["Percent Off", "GHS Off", "BOGOF", "Bundle", "Tier Upgrade"] as const).map(t => <option key={t}>{t}</option>)}
          </Select>
        </Field>
        <Field label="Cap (optional)">
          <Input value={cap} onChange={(e) => setCap(e.target.value)} placeholder="500" />
        </Field>
      </div>
      <Field label="Scope *" hint="Categories, SKUs, member tiers — anything POS can match.">
        <Input value={scope} onChange={(e) => setScope(e.target.value)} placeholder="Snacks & Beverages" />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Starts">
          <Input value={start} onChange={(e) => setStart(e.target.value)} placeholder="2026-04-15" />
        </Field>
        <Field label="Ends">
          <Input value={end} onChange={(e) => setEnd(e.target.value)} placeholder="2026-04-30" />
        </Field>
      </div>
      <Card padding={16} style={{ marginTop: 14, background: `${T.amber}0A`, border: `1px dashed ${T.amber}40` }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: T.amber, fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>Cannibalisation</div>
        <div style={{ fontSize: 12, color: T.txM }}>
          POS will pick the discount that benefits the customer <strong style={{ color: T.tx }}>most</strong>. Stack only if you tag this promo as <em style={{ color: T.amber }}>stackable</em>.
        </div>
      </Card>
    </Drawer>
  )
}
