"use client";

import { useState, useEffect, useCallback } from "react";
import { StationGate, OperatorBadge } from "@/components/station-gate";
import { useStationTheme, ThemeToggle, StationThemeProvider, COPPER, fontFamily } from "@/hooks/use-station-theme";
import { ModuleStrip } from "@/components/ModuleBadge";
import { MODULE_REGISTRY } from "@/lib/modules";
import { renderCard, TEMPLATE_LIST, type TemplateKey, type CustomTemplate, type CardData } from "@/lib/card-templates";
import { useHospitalName } from "@/hooks/use-hospital-name";
import { useHospitalCode } from "@/hooks/use-hospital-code";
import type { OperatorSession } from "@/types";

const HOSPITAL_NAME_FALLBACK = "Korle Bu Teaching Hospital";

type Card = {
  id: string;
  cardNumber: string;
  patientName: string;
  phone: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  bloodType: string | null;
  insuranceProvider: string | null;
  createdAt: string;
  totalVisits?: number;
  lastVisit?: string | null;
};

type CardStats = {
  total: number;
  newThisWeek: number;
  activeThisMonth: number;
  withInsurance: number;
};

type Booking = {
  id: string;
  patientName: string;
  patientPhone: string | null;
  doctorId: string | null;
  departmentKey: string | null;
  scheduledAt: string;
  durationMins: number;
  status: string;
  fee: number;
  feePaid: boolean;
  notes: string | null;
};

export default function CardsBookingsPage() {
  const HOSPITAL_CODE = useHospitalCode();
  return (
    <StationGate hospitalCode={HOSPITAL_CODE} stationName="Cards & Bookings" stationIcon="💳">
      {(operator) => <CardsBookingsContent operator={operator} />}
    </StationGate>
  );
}

function CardsBookingsContent({ operator }: { operator: OperatorSession }) {
  const HOSPITAL_CODE = useHospitalCode();
  const theme = useStationTheme();
  const HOSPITAL_NAME = useHospitalName(HOSPITAL_CODE, HOSPITAL_NAME_FALLBACK);
  const [tab, setTab] = useState<"cards" | "bookings" | "templates">("cards");
  const [activeModules, setActiveModules] = useState<string[]>([]);
  const [cardTemplate, setCardTemplate] = useState<TemplateKey>("classic_copper");
  const [cardTemplateCustom, setCardTemplateCustom] = useState<CustomTemplate | null>(null);

  const loadHospital = useCallback(async () => {
    try {
      const res = await fetch(`/api/hospitals?code=${HOSPITAL_CODE}`);
      if (res.ok) {
        const data = await res.json();
        const mods: string[] = data.activeModules ?? [];
        setActiveModules(mods);
        if (data.cardTemplate) setCardTemplate(data.cardTemplate as TemplateKey);
        if (data.cardTemplateCustom) setCardTemplateCustom(data.cardTemplateCustom as CustomTemplate);
      }
    } catch {}
  }, [HOSPITAL_CODE]);

  useEffect(() => { loadHospital(); }, [loadHospital]);

  return (
    <StationThemeProvider theme={theme}>
    <div style={{ minHeight: "100vh", background: theme.pageBg, color: theme.textPrimary, fontFamily: fontFamily.primary }}>
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, padding: "16px 36px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: theme.headerBorder, background: theme.headerBg,
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 22 }}>💳</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 0.4, color: COPPER, textTransform: "uppercase" }}>Cards & Bookings</div>
            <div style={{ fontSize: 11, color: theme.textSecondary }}>{HOSPITAL_NAME}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <ThemeToggle isDayMode={theme.isDayMode} onToggle={theme.toggle} />
          <div style={{ width: 1, height: 16, background: theme.divider }} />
          <ModuleStrip registry={MODULE_REGISTRY} activeModules={activeModules} />
          <div style={{ width: 1, height: 16, background: theme.divider }} />
          <OperatorBadge session={operator} onLogout={() => window.location.reload()} />
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 32px 60px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          <TabButton label="Patient Cards" active={tab === "cards"} onClick={() => setTab("cards")} icon="💳" />
          <TabButton label="Bookings" active={tab === "bookings"} onClick={() => setTab("bookings")} icon="📅" />
          <TabButton label="Card Templates" active={tab === "templates"} onClick={() => setTab("templates")} icon="🎨" />
        </div>
        {tab === "cards" && <CardsPanel operatorId={operator.operatorId} template={cardTemplate} customTemplate={cardTemplateCustom} />}
        {tab === "bookings" && <BookingsPanel operatorId={operator.operatorId} />}
        {tab === "templates" && <CardTemplatesPanel activeKey={cardTemplate} custom={cardTemplateCustom} onSaved={loadHospital} />}
      </main>
    </div>
    </StationThemeProvider>
  );
}

function TabButton({ label, active, onClick, icon }: { label: string; active: boolean; onClick: () => void; icon: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 18px", borderRadius: 8,
        background: active ? `${COPPER}22` : "rgba(255,255,255,0.04)",
        border: active ? `1px solid ${COPPER}66` : "1px solid rgba(255,255,255,0.06)",
        color: active ? "#F5E9DA" : "rgba(245,245,240,0.6)",
        fontSize: 13, fontWeight: 700, letterSpacing: 0.3, cursor: "pointer",
        display: "flex", alignItems: "center", gap: 8,
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

// ─── Cards Panel ────────────────────────────────────────────────
function CardsPanel({ operatorId, template, customTemplate }: { operatorId: string; template: TemplateKey; customTemplate: CustomTemplate | null }) {
  const HOSPITAL_CODE = useHospitalCode();
  const HOSPITAL_NAME = useHospitalName(HOSPITAL_CODE, HOSPITAL_NAME_FALLBACK);
  const [query, setQuery] = useState("");
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [stats, setStats] = useState<CardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCard, setNewCard] = useState({ patientName: "", phone: "", dateOfBirth: "", gender: "", bloodType: "", insuranceProvider: "" });

  const loadInventory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cards?hospitalCode=${HOSPITAL_CODE}`);
      if (res.ok) {
        const data = await res.json();
        setAllCards(data.cards ?? []);
        setStats(data.stats ?? null);
      }
    } finally {
      setLoading(false);
    }
  }, [HOSPITAL_CODE]);

  useEffect(() => { loadInventory(); }, [loadInventory]);

  const filtered = query.trim().length >= 2
    ? allCards.filter((c) => {
        const needle = query.trim().toLowerCase();
        return (
          c.cardNumber.toLowerCase().includes(needle) ||
          c.patientName.toLowerCase().includes(needle) ||
          (c.phone ?? "").toLowerCase().includes(needle)
        );
      })
    : allCards;

  async function createCard() {
    if (!newCard.patientName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, ...newCard, createdBy: operatorId }),
      });
      if (res.ok) {
        setShowNew(false);
        setNewCard({ patientName: "", phone: "", dateOfBirth: "", gender: "", bloodType: "", insuranceProvider: "" });
        loadInventory();
      }
    } finally {
      setCreating(false);
    }
  }

  async function printCard(card: Card) {
    const w = window.open("", "_blank");
    if (!w) return;
    const data: CardData = {
      cardNumber: card.cardNumber,
      patientName: card.patientName,
      phone: card.phone,
      dateOfBirth: card.dateOfBirth,
      hospitalName: HOSPITAL_NAME,
      hospitalCode: HOSPITAL_CODE,
    };
    w.document.write(renderCard(data, template, customTemplate, true));
    w.document.close();
  }

  return (
    <div>
      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        <StatCard label="Total Members" value={stats?.total ?? 0} icon="👥" />
        <StatCard label="New This Week" value={stats?.newThisWeek ?? 0} icon="🆕" />
        <StatCard label="Active This Month" value={stats?.activeThisMonth ?? 0} icon="📈" />
        <StatCard label="With Insurance" value={stats?.withInsurance ?? 0} icon="🛡️" />
      </div>

      {/* Search + new-card button */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by card number, name, or phone…"
          style={inputStyle}
        />
        <button onClick={() => setShowNew(!showNew)} style={btnPrimary}>
          {showNew ? "Cancel" : "+ New Card"}
        </button>
      </div>

      {showNew && (
        <div style={panelStyle}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 12 }}>
            <FieldInput label="Patient Name *" value={newCard.patientName} onChange={(v) => setNewCard({ ...newCard, patientName: v })} />
            <FieldInput label="Phone" value={newCard.phone} onChange={(v) => setNewCard({ ...newCard, phone: v })} />
            <FieldInput label="Date of Birth" value={newCard.dateOfBirth} onChange={(v) => setNewCard({ ...newCard, dateOfBirth: v })} placeholder="YYYY-MM-DD" />
            <FieldInput label="Gender" value={newCard.gender} onChange={(v) => setNewCard({ ...newCard, gender: v })} />
            <FieldInput label="Blood Type" value={newCard.bloodType} onChange={(v) => setNewCard({ ...newCard, bloodType: v })} />
            <FieldInput label="Insurance" value={newCard.insuranceProvider} onChange={(v) => setNewCard({ ...newCard, insuranceProvider: v })} />
          </div>
          <button onClick={createCard} disabled={creating || !newCard.patientName.trim()} style={btnPrimary}>
            {creating ? "Creating…" : "Issue Card"}
          </button>
        </div>
      )}

      {/* Member inventory table */}
      <div style={{ marginTop: 20, overflow: "hidden", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={tableHeaderRow}>
          <div style={{ flex: "0 0 140px" }}>Card #</div>
          <div style={{ flex: "1 1 auto" }}>Member</div>
          <div style={{ flex: "0 0 130px" }}>Phone</div>
          <div style={{ flex: "0 0 90px", textAlign: "center" }}>Visits</div>
          <div style={{ flex: "0 0 140px" }}>Last Visit</div>
          <div style={{ flex: "0 0 150px" }}>Insurance</div>
          <div style={{ flex: "0 0 90px", textAlign: "right" }}></div>
        </div>
        {loading && (
          <div style={{ padding: 24, textAlign: "center", color: "rgba(245,245,240,0.5)", fontSize: 13 }}>Loading members…</div>
        )}
        {!loading && filtered.length === 0 && (
          <div style={{ padding: 24, textAlign: "center", color: "rgba(245,245,240,0.5)", fontSize: 13 }}>
            {query.length >= 2 ? `No members match "${query}"` : "No members yet. Issue the first card above."}
          </div>
        )}
        {!loading && filtered.map((c, i) => (
          <div key={c.id} style={{ ...tableRow, background: i % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent" }}>
            <div style={{ flex: "0 0 140px", fontFamily: fontFamily.mono, fontWeight: 800, color: COPPER, fontSize: 12 }}>{c.cardNumber}</div>
            <div style={{ flex: "1 1 auto" }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{c.patientName}</div>
              <div style={{ fontSize: 10, color: "rgba(245,245,240,0.5)", marginTop: 2 }}>
                {[c.gender, c.bloodType].filter(Boolean).join(" • ") || "—"}
              </div>
            </div>
            <div style={{ flex: "0 0 130px", fontSize: 12, color: "rgba(245,245,240,0.75)", fontFamily: fontFamily.mono }}>{c.phone ?? "—"}</div>
            <div style={{ flex: "0 0 90px", textAlign: "center", fontSize: 13, fontWeight: 800, color: (c.totalVisits ?? 0) > 0 ? "#86EFAC" : "rgba(245,245,240,0.4)" }}>
              {c.totalVisits ?? 0}
            </div>
            <div style={{ flex: "0 0 140px", fontSize: 11, color: "rgba(245,245,240,0.6)" }}>
              {c.lastVisit ? new Date(c.lastVisit).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
            </div>
            <div style={{ flex: "0 0 150px" }}>
              {c.insuranceProvider && c.insuranceProvider.toLowerCase() !== "none" ? (
                <span style={{
                  display: "inline-block", whiteSpace: "nowrap",
                  maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis",
                  padding: "3px 8px", borderRadius: 5,
                  background: "rgba(34,197,94,0.15)", color: "#86EFAC",
                  fontSize: 10, fontWeight: 700, letterSpacing: 0.4,
                }}>
                  {c.insuranceProvider}
                </span>
              ) : (
                <span style={{ fontSize: 12, color: "rgba(245,245,240,0.7)", fontWeight: 500 }}>Self-pay</span>
              )}
            </div>
            <div style={{ flex: "0 0 90px", textAlign: "right" }}>
              <button onClick={() => printCard(c)} style={btnSmall}>🖨️ Print</button>
            </div>
          </div>
        ))}
      </div>

      {!loading && filtered.length > 0 && query.length >= 2 && (
        <div style={{ marginTop: 12, fontSize: 11, color: "rgba(245,245,240,0.5)" }}>
          Showing {filtered.length} of {allCards.length} members
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div style={{
      padding: "16px 18px", borderRadius: 10,
      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
      display: "flex", alignItems: "center", gap: 14,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10, fontSize: 18,
        background: `${COPPER}18`, display: "flex", alignItems: "center", justifyContent: "center",
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 10, color: "rgba(245,245,240,0.55)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#F5F5F0", marginTop: 2 }}>{value.toLocaleString()}</div>
      </div>
    </div>
  );
}

// ─── Bookings Panel ────────────────────────────────────────────
function BookingsPanel({ operatorId }: { operatorId: string }) {
  const HOSPITAL_CODE = useHospitalCode();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newBooking, setNewBooking] = useState({
    patientName: "", patientPhone: "", scheduledAt: "", durationMins: 30,
    departmentKey: "", fee: 0, notes: "",
  });

  const load = useCallback(async () => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const weekAhead = new Date(); weekAhead.setDate(weekAhead.getDate() + 14);
    const res = await fetch(`/api/bookings?hospitalCode=${HOSPITAL_CODE}&from=${today.toISOString()}&to=${weekAhead.toISOString()}`);
    if (res.ok) setBookings(await res.json());
  }, [HOSPITAL_CODE]);

  useEffect(() => { load(); }, [load]);

  async function createBooking() {
    if (!newBooking.patientName.trim() || !newBooking.scheduledAt) return;
    setCreating(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalCode: HOSPITAL_CODE,
          ...newBooking,
          scheduledAt: new Date(newBooking.scheduledAt).toISOString(),
          createdBy: operatorId,
        }),
      });
      if (res.ok) {
        setShowNew(false);
        setNewBooking({ patientName: "", patientPhone: "", scheduledAt: "", durationMins: 30, departmentKey: "", fee: 0, notes: "" });
        load();
      }
    } finally {
      setCreating(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch("/api/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: id, status, actorId: operatorId }),
    });
    if (res.ok) load();
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 14, color: "rgba(245,245,240,0.7)" }}>
          {bookings.length} booking{bookings.length === 1 ? "" : "s"} in the next 14 days
        </div>
        <button onClick={() => setShowNew(!showNew)} style={btnPrimary}>
          {showNew ? "Cancel" : "+ New Booking"}
        </button>
      </div>

      {showNew && (
        <div style={panelStyle}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 12 }}>
            <FieldInput label="Patient Name *" value={newBooking.patientName} onChange={(v) => setNewBooking({ ...newBooking, patientName: v })} />
            <FieldInput label="Phone" value={newBooking.patientPhone} onChange={(v) => setNewBooking({ ...newBooking, patientPhone: v })} />
            <div>
              <div style={labelStyle}>Scheduled At *</div>
              <input type="datetime-local" value={newBooking.scheduledAt} onChange={(e) => setNewBooking({ ...newBooking, scheduledAt: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <div style={labelStyle}>Duration (mins)</div>
              <input type="number" value={newBooking.durationMins} onChange={(e) => setNewBooking({ ...newBooking, durationMins: Number(e.target.value) })} style={inputStyle} />
            </div>
            <FieldInput label="Department" value={newBooking.departmentKey} onChange={(v) => setNewBooking({ ...newBooking, departmentKey: v })} placeholder="consultation, imaging, etc" />
            <div>
              <div style={labelStyle}>Fee (GHS)</div>
              <input type="number" value={newBooking.fee} onChange={(e) => setNewBooking({ ...newBooking, fee: Number(e.target.value) })} style={inputStyle} />
            </div>
          </div>
          <div>
            <div style={labelStyle}>Notes</div>
            <textarea value={newBooking.notes} onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })} style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} />
          </div>
          <button onClick={createBooking} disabled={creating || !newBooking.patientName.trim() || !newBooking.scheduledAt} style={{ ...btnPrimary, marginTop: 12 }}>
            {creating ? "Creating…" : "Create Booking"}
          </button>
        </div>
      )}

      <div style={{ display: "grid", gap: 10, marginTop: 20 }}>
        {bookings.map((b) => {
          const when = new Date(b.scheduledAt);
          return (
            <div key={b.id} style={bookingItemStyle}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{b.patientName}</div>
                <div style={{ fontSize: 12, color: "rgba(245,245,240,0.6)", marginTop: 2 }}>
                  {when.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                  {" · "}
                  {when.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  {b.departmentKey && ` · ${b.departmentKey}`}
                  {b.fee > 0 && ` · GHS ${b.fee.toFixed(2)} ${b.feePaid ? "✓" : "(unpaid)"}`}
                </div>
              </div>
              <StatusBadge status={b.status} />
              {b.status === "PENDING" && (
                <button onClick={() => updateStatus(b.id, "CONFIRMED")} style={btnSmall}>Confirm</button>
              )}
              {b.status === "CONFIRMED" && (
                <button onClick={() => updateStatus(b.id, "CHECKED_IN")} style={btnSmall}>Check In</button>
              )}
              {b.status === "CHECKED_IN" && (
                <button onClick={() => updateStatus(b.id, "COMPLETED")} style={btnSmall}>Complete</button>
              )}
              {!["COMPLETED", "CANCELLED"].includes(b.status) && (
                <button onClick={() => updateStatus(b.id, "CANCELLED")} style={{ ...btnSmall, background: "rgba(239,68,68,0.18)", color: "#FCA5A5", border: "1px solid rgba(239,68,68,0.4)" }}>Cancel</button>
              )}
            </div>
          );
        })}
        {bookings.length === 0 && (
          <div style={{ color: "rgba(245,245,240,0.5)", fontSize: 13, textAlign: "center", padding: 40 }}>
            No bookings scheduled. Click + New Booking to add one.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Card Templates Panel ─────────────────────────────────────
function CardTemplatesPanel({ activeKey, custom, onSaved }: { activeKey: TemplateKey; custom: CustomTemplate | null; onSaved: () => void }) {
  const HOSPITAL_CODE = useHospitalCode();
  const HOSPITAL_NAME = useHospitalName(HOSPITAL_CODE, HOSPITAL_NAME_FALLBACK);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const sample: CardData = {
    cardNumber: "DH-PREVIEW",
    patientName: "Ama Mensah",
    phone: "+233 24 555 0199",
    dateOfBirth: "1992-04-18",
    hospitalName: HOSPITAL_NAME,
    hospitalCode: HOSPITAL_CODE,
  };

  async function selectTemplate(key: TemplateKey) {
    setSaving(true); setFeedback(null);
    try {
      const res = await fetch("/api/hospitals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalCode: HOSPITAL_CODE,
          actorId: "cards_bookings_operator",
          editFields: { cardTemplate: key },
        }),
      });
      if (res.ok) { setFeedback(`Template saved — ${TEMPLATE_LIST.find(t => t.key === key)?.label ?? key}`); onSaved(); }
      else setFeedback("Save failed — try again.");
    } finally { setSaving(false); }
  }

  async function uploadCustomBg(file: File) {
    setSaving(true); setFeedback(null);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const tpl: CustomTemplate = {
        bg: dataUrl,
        fields: [
          { key: "cardNumber",  x: 6,  y: 38, fontSize: 5, color: "#fff", weight: 800 },
          { key: "patientName", x: 6,  y: 45, fontSize: 3.2, color: "#fff", weight: 700 },
          { key: "hospitalName", x: 6, y: 6,  fontSize: 2.4, color: "#fff", weight: 800 },
        ],
      };
      const res = await fetch("/api/hospitals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalCode: HOSPITAL_CODE,
          actorId: "cards_bookings_operator",
          editFields: { cardTemplate: "custom", cardTemplateCustom: tpl },
        }),
      });
      if (res.ok) { setFeedback("Custom template uploaded."); onSaved(); }
      else setFeedback("Upload failed — try again.");
    } finally { setSaving(false); }
  }

  function previewInWindow(key: TemplateKey) {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(renderCard(sample, key, key === "custom" ? custom : null));
    w.document.close();
  }

  return (
    <div>
      <div style={{ ...panelStyle, marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: COPPER, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 6 }}>Card Templates</div>
        <div style={{ fontSize: 12, color: "rgba(245,245,240,0.6)", lineHeight: 1.6 }}>
          Pick a built-in design or upload your own background. Cards print at exactly CR80 dimensions
          (85.60mm × 53.98mm) — drop-in compatible with Zebra, Fargo, Evolis and any standard ID card printer.
        </div>
        {feedback && <div style={{ marginTop: 12, fontSize: 12, color: COPPER }}>{feedback}</div>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
        {TEMPLATE_LIST.map((t) => {
          const isActive = activeKey === t.key;
          return (
            <div key={t.key} style={{
              ...cardItemStyle,
              border: isActive ? `2px solid ${COPPER}` : cardItemStyle.border,
              boxShadow: isActive ? `0 0 24px ${COPPER}33` : "none",
            }}>
              <TemplateThumbnail templateKey={t.key} />
              <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800 }}>{t.label}</div>
                  <div style={{ fontSize: 10, color: "rgba(245,245,240,0.55)", marginTop: 2 }}>{t.tagline}</div>
                </div>
                {isActive && <span style={{ fontSize: 9, fontWeight: 800, color: COPPER, letterSpacing: 0.6 }}>ACTIVE</span>}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button onClick={() => previewInWindow(t.key)} style={btnSmall}>👁 Preview</button>
                <button onClick={() => selectTemplate(t.key)} disabled={isActive || saving} style={isActive ? { ...btnSmall, opacity: 0.4, cursor: "default" } : btnPrimary}>
                  {isActive ? "Selected" : "Use This"}
                </button>
              </div>
            </div>
          );
        })}

        {/* Custom upload tile */}
        <div style={{
          ...cardItemStyle,
          border: activeKey === "custom" ? `2px solid ${COPPER}` : `1px dashed rgba(184,115,51,0.4)`,
          boxShadow: activeKey === "custom" ? `0 0 24px ${COPPER}33` : "none",
        }}>
          <div style={{
            height: 180, borderRadius: 10, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 8,
            background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(184,115,51,0.25)",
          }}>
            <span style={{ fontSize: 36 }}>📤</span>
            <span style={{ fontSize: 12, color: "rgba(245,245,240,0.7)" }}>Upload Your Card Background</span>
            <span style={{ fontSize: 10, color: "rgba(245,245,240,0.45)" }}>PNG or JPG, 1014×640px recommended</span>
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 800 }}>Custom Template</div>
            <div style={{ fontSize: 10, color: "rgba(245,245,240,0.55)", marginTop: 2 }}>Bring your own brand. Field positions overlay automatically.</div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <label style={{ ...btnPrimary, display: "inline-flex", alignItems: "center", justifyContent: "center", flex: 1, cursor: "pointer" }}>
              {saving ? "Saving…" : custom ? "Replace Image" : "Upload"}
              <input type="file" accept="image/png,image/jpeg" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCustomBg(f); }} />
            </label>
            {custom && (
              <button onClick={() => previewInWindow("custom")} style={btnSmall}>👁</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TemplateThumbnail({ templateKey }: { templateKey: TemplateKey }) {
  const HOSPITAL_CODE = useHospitalCode();
  const HOSPITAL_NAME = useHospitalName(HOSPITAL_CODE, HOSPITAL_NAME_FALLBACK);
  const sample: CardData = {
    cardNumber: "DH-XXXXXX", patientName: "Ama Mensah", phone: "+233 24 555 0199",
    dateOfBirth: "1992-04-18", hospitalName: HOSPITAL_NAME, hospitalCode: HOSPITAL_CODE,
  };
  // Render the same template HTML inside a scaled iframe-free preview using srcDoc
  return (
    <iframe
      title={`preview-${templateKey}`}
      srcDoc={renderCard(sample, templateKey, null)}
      style={{
        width: "100%", height: 180, border: "none", borderRadius: 10,
        pointerEvents: "none", background: "#0F172A",
      }}
    />
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    PENDING: { bg: "rgba(148,163,184,0.18)", text: "#CBD5E1" },
    CONFIRMED: { bg: "rgba(59,130,246,0.18)", text: "#93C5FD" },
    CHECKED_IN: { bg: "rgba(245,158,11,0.18)", text: "#FCD34D" },
    COMPLETED: { bg: "rgba(34,197,94,0.18)", text: "#86EFAC" },
    CANCELLED: { bg: "rgba(239,68,68,0.18)", text: "#FCA5A5" },
    NO_SHOW: { bg: "rgba(120,113,108,0.2)", text: "#A8A29E" },
  };
  const c = colors[status] ?? colors.PENDING;
  return (
    <span style={{ padding: "4px 10px", borderRadius: 6, background: c.bg, color: c.text, fontSize: 10, fontWeight: 800, letterSpacing: 0.6 }}>
      {status.replace("_", " ")}
    </span>
  );
}

function FieldInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <div style={labelStyle}>{label}</div>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────

const inputStyle = {
  width: "100%", padding: "10px 14px",
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 8, color: "#F5F5F0", fontSize: 13, fontFamily: "inherit",
} as const;

const labelStyle = {
  fontSize: 10, color: "rgba(245,245,240,0.5)", textTransform: "uppercase" as const,
  letterSpacing: 1, fontWeight: 700, marginBottom: 4,
};

const btnPrimary = {
  padding: "10px 20px", background: COPPER, color: "#0F0F12",
  border: "none", borderRadius: 8, fontSize: 13, fontWeight: 800,
  letterSpacing: 0.3, textTransform: "uppercase" as const, cursor: "pointer",
};

const btnSmall = {
  padding: "6px 12px", background: "rgba(184,115,51,0.18)", color: "#F5E9DA",
  border: "1px solid rgba(184,115,51,0.42)", borderRadius: 6, fontSize: 11,
  fontWeight: 700, letterSpacing: 0.3, textTransform: "uppercase" as const, cursor: "pointer",
};

const panelStyle = {
  padding: 20, borderRadius: 12, background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)", marginBottom: 16,
};

const cardItemStyle = {
  padding: 16, borderRadius: 10, background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
};

const bookingItemStyle = {
  display: "flex", alignItems: "center", gap: 12, padding: "14px 18px",
  borderRadius: 10, background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
};

const tableHeaderRow = {
  display: "flex", alignItems: "center", gap: 14, padding: "10px 16px",
  background: "rgba(184,115,51,0.08)", borderBottom: "1px solid rgba(184,115,51,0.2)",
  fontSize: 10, fontWeight: 800, color: COPPER, textTransform: "uppercase" as const, letterSpacing: 1,
};

const tableRow = {
  display: "flex", alignItems: "center", gap: 14, padding: "12px 16px",
  borderBottom: "1px solid rgba(255,255,255,0.04)",
};
