"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { StationGate } from "@/components/station-gate";
import type { OperatorSession } from "@/types";

const HOSPITAL_CODE = "KBH";

type TabId = "revenue" | "payouts" | "shifts";

type RevenueRow = {
  key: string; label: string;
  gross: number; staffCut: number; net: number;
  items: number; patients: number;
};

type RevenueResponse = {
  from: string; to: string; groupBy: string;
  totals: { gross: number; staffCut: number; net: number; items: number; patients: number };
  rows: RevenueRow[];
};

type Doctor = {
  id: string; name: string; specialty: string;
};

type Shift = {
  id: string; doctorId: string; shiftType: string;
  clockInAt: string; clockOutAt: string | null;
  grossRevenue: number; patientCount: number;
};

type Payout = {
  id: string; doctorId: string; doctorName?: string; doctorSpecialty?: string;
  periodStart: string; periodEnd: string;
  grossRevenue: number; commissionRate: number; amountDue: number;
  status: "PENDING" | "PAID" | "CANCELLED";
  paidAt: string | null; paidBy: string | null;
  paymentMethod: "CASH" | "MOMO" | "BANK" | null;
  paymentRef: string | null;
  createdAt: string;
};

export default function FinancePage() {
  return (
    <StationGate
      hospitalCode={HOSPITAL_CODE}
      stationName="Finance"
      stationIcon="💰"
      allowedRoles={["admin", "super_admin", "owner", "hospital_admin"]}
    >
      {(operator) => <FinanceContent operator={operator} />}
    </StationGate>
  );
}

function FinanceContent({ operator }: { operator: OperatorSession }) {
  const [tab, setTab] = useState<TabId>("revenue");

  return (
    <div style={{ minHeight: "100vh", background: "#0F0F12", color: "#F5F5F0", paddingBottom: 64 }}>
      <header style={{ padding: "32px 40px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ color: "#B87333", fontSize: 12, letterSpacing: 2, fontWeight: 800, textTransform: "uppercase" }}>Finance</div>
            <h1 style={{ fontSize: 36, fontWeight: 800, margin: "4px 0 0", letterSpacing: -1 }}>Revenue & Payouts</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Link
              href="/rates"
              style={{
                padding: "8px 14px", borderRadius: 8,
                background: "rgba(184,115,51,0.14)", border: "1px solid rgba(184,115,51,0.38)",
                color: "#F5E9DA", fontSize: 12, fontWeight: 800, letterSpacing: 0.3,
                textTransform: "uppercase", textDecoration: "none",
              }}
            >
              Pricing →
            </Link>
            <div style={{ fontSize: 13, color: "rgba(245,245,240,0.5)" }}>
              Signed in as <span style={{ color: "#F5F5F0", fontWeight: 700 }}>{operator.operatorName}</span>
            </div>
          </div>
        </div>

        <nav style={{ display: "flex", gap: 4, marginTop: 24 }}>
          {(["revenue", "payouts", "shifts"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "10px 20px",
                background: tab === t ? "rgba(184,115,51,0.14)" : "transparent",
                border: tab === t ? "1px solid rgba(184,115,51,0.38)" : "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10,
                color: tab === t ? "#F5E9DA" : "rgba(245,245,240,0.7)",
                fontSize: 13, fontWeight: 700, letterSpacing: 0.3, textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              {t === "revenue" ? "Revenue" : t === "payouts" ? "Payouts" : "Shifts"}
            </button>
          ))}
        </nav>
      </header>

      <main style={{ padding: 40 }}>
        {tab === "revenue" && <RevenueTab />}
        {tab === "payouts" && <PayoutsTab operator={operator} />}
        {tab === "shifts" && <ShiftsTab operator={operator} />}
      </main>
    </div>
  );
}

// ─── REVENUE TAB ──────────────────────────────────────────────

function isoDay(offsetDays: number) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function RevenueTab() {
  const [from, setFrom] = useState(isoDay(-30));
  const [to, setTo] = useState(isoDay(0));
  const [groupBy, setGroupBy] = useState<"doctor" | "department" | "shift" | "day" | "week" | "month" | "service">("doctor");
  const [data, setData] = useState<RevenueResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ hospitalCode: HOSPITAL_CODE, from: `${from}T00:00:00`, to: `${to}T23:59:59`, groupBy });
      const res = await fetch(`/api/finance/revenue?${params}`);
      const json = await res.json();
      if (res.ok) setData(json);
    } finally {
      setLoading(false);
    }
  }, [from, to, groupBy]);

  useEffect(() => { load(); }, [load]);

  const totals = data?.totals;

  return (
    <div>
      {/* Filter bar */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 24 }}>
        <Filter label="From"><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={inputStyle} /></Filter>
        <Filter label="To"><input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={inputStyle} /></Filter>
        <Filter label="Group By">
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as typeof groupBy)} style={inputStyle}>
            <option value="doctor">Doctor</option>
            <option value="department">Department</option>
            <option value="shift">Shift</option>
            <option value="service">Service Type</option>
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
        </Filter>
        <button onClick={load} disabled={loading} style={btnPrimary}>
          {loading ? "Loading…" : "Refresh"}
        </button>
        <button
          onClick={() => {
            const params = new URLSearchParams({
              type: "period",
              hospitalCode: HOSPITAL_CODE,
              from: `${from}T00:00:00`,
              to: `${to}T23:59:59`,
              groupBy,
            });
            window.open(`/api/reports?${params}`);
          }}
          style={btnSecondary}
        >
          Download PDF
        </button>
      </div>

      {/* Quick date presets */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <Preset label="Today" onClick={() => { setFrom(isoDay(0)); setTo(isoDay(0)); }} />
        <Preset label="Yesterday" onClick={() => { setFrom(isoDay(-1)); setTo(isoDay(-1)); }} />
        <Preset label="Last 7 Days" onClick={() => { setFrom(isoDay(-7)); setTo(isoDay(0)); }} />
        <Preset label="Last 30 Days" onClick={() => { setFrom(isoDay(-30)); setTo(isoDay(0)); }} />
        <Preset label="This Month" onClick={() => {
          const n = new Date();
          setFrom(new Date(n.getFullYear(), n.getMonth(), 1).toISOString().slice(0, 10));
          setTo(isoDay(0));
        }} />
      </div>

      {/* Totals cards */}
      {totals && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 24 }}>
          <StatCard label="Gross Revenue" value={`¢${totals.gross.toLocaleString()}`} color="#F5E9DA" />
          <StatCard label="Staff Cut" value={`¢${totals.staffCut.toLocaleString()}`} color="#C4B5FD" />
          <StatCard label="Hospital Net" value={`¢${totals.net.toLocaleString()}`} color="#86EFAC" />
          <StatCard label="Items" value={totals.items.toLocaleString()} color="#93C5FD" />
          <StatCard label="Patients" value={totals.patients.toLocaleString()} color="#FCD34D" />
        </div>
      )}

      {/* Breakdown table */}
      <div style={cardStyle}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color: "#B87333", marginBottom: 16 }}>
          Breakdown by {groupBy}
        </div>
        {data?.rows.length ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <Th>{groupBy[0].toUpperCase() + groupBy.slice(1)}</Th>
                  <Th align="right">Gross</Th>
                  <Th align="right">Staff Cut</Th>
                  <Th align="right">Net</Th>
                  <Th align="right">Items</Th>
                  <Th align="right">Patients</Th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr key={r.key} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <Td>{r.label}</Td>
                    <Td align="right" mono>¢{r.gross.toLocaleString()}</Td>
                    <Td align="right" mono>¢{r.staffCut.toLocaleString()}</Td>
                    <Td align="right" mono>¢{r.net.toLocaleString()}</Td>
                    <Td align="right" mono>{r.items}</Td>
                    <Td align="right" mono>{r.patients}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ color: "rgba(245,245,240,0.5)", fontSize: 14 }}>No revenue in this period.</div>
        )}
      </div>
    </div>
  );
}

// ─── PAYOUTS TAB ──────────────────────────────────────────────

function PayoutsTab({ operator }: { operator: OperatorSession }) {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [from, setFrom] = useState(isoDay(-7));
  const [to, setTo] = useState(isoDay(0));
  const [preview, setPreview] = useState<{ gross: number; due: number; commissionRate: number } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, dRes] = await Promise.all([
        fetch(`/api/payouts?hospitalCode=${HOSPITAL_CODE}`),
        fetch(`/api/doctors?hospitalCode=${HOSPITAL_CODE}`),
      ]);
      if (pRes.ok) setPayouts(await pRes.json());
      if (dRes.ok) setDoctors(await dRes.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const previewDue = async () => {
    if (!selectedDoctorId) return;
    const params = new URLSearchParams({
      hospitalCode: HOSPITAL_CODE, doctorId: selectedDoctorId, preview: "true",
      from: `${from}T00:00:00`, to: `${to}T23:59:59`,
    });
    const res = await fetch(`/api/payouts?${params}`);
    if (res.ok) setPreview(await res.json());
  };

  const generate = async () => {
    if (!selectedDoctorId) return;
    const res = await fetch("/api/payouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create", hospitalCode: HOSPITAL_CODE,
        doctorId: selectedDoctorId,
        from: `${from}T00:00:00`, to: `${to}T23:59:59`,
        createdBy: operator.operatorName,
      }),
    });
    if (res.ok) { setPreview(null); await load(); }
  };

  const markPaid = async (payoutId: string) => {
    const method = window.prompt("Payment method? CASH / MOMO / BANK", "MOMO");
    if (!method || !["CASH", "MOMO", "BANK"].includes(method.toUpperCase())) return;
    const paymentRef = window.prompt("Payment reference (optional)", "") ?? "";
    const res = await fetch("/api/payouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "mark_paid", hospitalCode: HOSPITAL_CODE,
        payoutId, paidBy: operator.operatorName,
        paymentMethod: method.toUpperCase(), paymentRef,
      }),
    });
    if (res.ok) await load();
  };

  return (
    <div>
      {/* Generate payout */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color: "#B87333", marginBottom: 16 }}>
          Generate Payout
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <Filter label="Doctor">
            <select value={selectedDoctorId} onChange={(e) => { setSelectedDoctorId(e.target.value); setPreview(null); }} style={inputStyle}>
              <option value="">— select —</option>
              {doctors.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>)}
            </select>
          </Filter>
          <Filter label="From"><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={inputStyle} /></Filter>
          <Filter label="To"><input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={inputStyle} /></Filter>
          <button onClick={previewDue} disabled={!selectedDoctorId} style={btnSecondary}>Preview</button>
          <button onClick={generate} disabled={!selectedDoctorId || !preview} style={btnPrimary}>Create Payout</button>
        </div>
        {preview && (
          <div style={{ marginTop: 16, display: "flex", gap: 24, fontSize: 14 }}>
            <span>Gross: <strong style={{ color: "#F5E9DA" }}>¢{preview.gross.toLocaleString()}</strong></span>
            <span>Commission Rate: <strong style={{ color: "#C4B5FD" }}>{preview.commissionRate}%</strong></span>
            <span>Amount Due: <strong style={{ color: "#86EFAC" }}>¢{preview.due.toLocaleString()}</strong></span>
          </div>
        )}
      </div>

      {/* Payout ledger */}
      <div style={cardStyle}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color: "#B87333", marginBottom: 16 }}>
          Payout Ledger
        </div>
        {loading ? (
          <div style={{ color: "rgba(245,245,240,0.5)" }}>Loading…</div>
        ) : payouts.length === 0 ? (
          <div style={{ color: "rgba(245,245,240,0.5)", fontSize: 14 }}>No payouts yet.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <Th>Doctor</Th>
                  <Th>Period</Th>
                  <Th align="right">Gross</Th>
                  <Th align="right">Rate</Th>
                  <Th align="right">Due</Th>
                  <Th>Status</Th>
                  <Th>Payment</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <Td>{p.doctorName ?? p.doctorId}</Td>
                    <Td mono>{p.periodStart.slice(0, 10)} → {p.periodEnd.slice(0, 10)}</Td>
                    <Td align="right" mono>¢{p.grossRevenue.toLocaleString()}</Td>
                    <Td align="right" mono>{p.commissionRate}%</Td>
                    <Td align="right" mono>¢{p.amountDue.toLocaleString()}</Td>
                    <Td><StatusBadge status={p.status} /></Td>
                    <Td mono style={{ fontSize: 12 }}>{p.paymentMethod ? `${p.paymentMethod}${p.paymentRef ? ` · ${p.paymentRef}` : ""}` : "—"}</Td>
                    <Td align="right">
                      {p.status === "PENDING" ? (
                        <button onClick={() => markPaid(p.id)} style={btnSmall}>Mark Paid</button>
                      ) : null}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── STAFF & SHIFTS TAB ──────────────────────────────────────────────

function ShiftsTab({ operator }: { operator: OperatorSession }) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dRes, sRes] = await Promise.all([
        fetch(`/api/doctors?hospitalCode=${HOSPITAL_CODE}`),
        fetch(`/api/shifts?hospitalCode=${HOSPITAL_CODE}`),
      ]);
      if (dRes.ok) setDoctors(await dRes.json());
      if (sRes.ok) setShifts(await sRes.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const clockIn = async (doctorId: string) => {
    const shiftType = window.prompt("Shift type? morning / afternoon / evening / night / custom", "morning");
    if (!shiftType) return;
    const res = await fetch("/api/shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clock_in", hospitalCode: HOSPITAL_CODE, doctorId, shiftType }),
    });
    if (!res.ok) {
      const err = await res.json();
      window.alert(err.error || "Failed");
      return;
    }
    await load();
  };

  const clockOut = async (shiftId: string) => {
    if (!window.confirm("Clock out this shift?")) return;
    const res = await fetch("/api/shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clock_out", hospitalCode: HOSPITAL_CODE, shiftId }),
    });
    if (res.ok) await load();
  };

  const activeShifts = useMemo(() => shifts.filter((s) => !s.clockOutAt), [shifts]);
  const recentClosed = useMemo(() => shifts.filter((s) => s.clockOutAt).slice(0, 20), [shifts]);
  const activeByDoctor = useMemo(() => new Map(activeShifts.map((s) => [s.doctorId, s])), [activeShifts]);

  return (
    <div>
      {/* Active shifts */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color: "#B87333", marginBottom: 16 }}>
          Active Shifts ({activeShifts.length})
        </div>
        {activeShifts.length === 0 ? (
          <div style={{ color: "rgba(245,245,240,0.5)", fontSize: 14 }}>No doctors currently clocked in.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {activeShifts.map((s) => {
              const doc = doctors.find((d) => d.id === s.doctorId);
              return (
                <div key={s.id} style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.24)", borderRadius: 10, padding: 16 }}>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{doc?.name ?? s.doctorId}</div>
                  <div style={{ fontSize: 12, color: "rgba(245,245,240,0.6)", marginTop: 4 }}>{s.shiftType} · started {new Date(s.clockInAt).toLocaleTimeString().slice(0, 5)}</div>
                  <button onClick={() => clockOut(s.id)} style={{ ...btnSecondary, marginTop: 12, width: "100%" }}>Clock Out</button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Clock In doctors not currently active */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color: "#B87333" }}>
            Clock In Doctor
          </div>
          <Link href="/rates" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", color: "rgba(245,245,240,0.6)", textDecoration: "none" }}>
            Edit Fees & Commission in Pricing →
          </Link>
        </div>
        {loading ? (
          <div style={{ color: "rgba(245,245,240,0.5)" }}>Loading…</div>
        ) : doctors.length === 0 ? (
          <div style={{ color: "rgba(245,245,240,0.5)", fontSize: 14 }}>No doctors registered.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
            {doctors.filter((d) => !activeByDoctor.has(d.id)).map((d) => (
              <div key={d.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "#0F0F12", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{d.name}</div>
                  <div style={{ fontSize: 11, color: "rgba(245,245,240,0.5)", textTransform: "capitalize" }}>{d.specialty}</div>
                </div>
                <button onClick={() => clockIn(d.id)} style={btnSmall}>Clock In</button>
              </div>
            ))}
            {doctors.every((d) => activeByDoctor.has(d.id)) && (
              <div style={{ color: "rgba(245,245,240,0.5)", fontSize: 14 }}>Every doctor is on shift.</div>
            )}
          </div>
        )}
      </div>

      {/* Recent closed shifts */}
      <div style={cardStyle}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color: "#B87333", marginBottom: 16 }}>
          Recent Closed Shifts
        </div>
        {recentClosed.length === 0 ? (
          <div style={{ color: "rgba(245,245,240,0.5)", fontSize: 14 }}>No closed shifts yet.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <Th>Doctor</Th>
                  <Th>Shift</Th>
                  <Th>Start</Th>
                  <Th>End</Th>
                  <Th align="right">Gross</Th>
                  <Th align="right">Patients</Th>
                </tr>
              </thead>
              <tbody>
                {recentClosed.map((s) => {
                  const doc = doctors.find((d) => d.id === s.doctorId);
                  return (
                    <tr key={s.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <Td>{doc?.name ?? s.doctorId}</Td>
                      <Td>{s.shiftType}</Td>
                      <Td mono style={{ fontSize: 12 }}>{new Date(s.clockInAt).toLocaleString()}</Td>
                      <Td mono style={{ fontSize: 12 }}>{s.clockOutAt ? new Date(s.clockOutAt).toLocaleString() : "—"}</Td>
                      <Td align="right" mono>¢{s.grossRevenue.toLocaleString()}</Td>
                      <Td align="right" mono>{s.patientCount}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ marginTop: 16, fontSize: 12, color: "rgba(245,245,240,0.4)" }}>
        Signed in as {operator.operatorName}. Changes are audited.
      </div>
    </div>
  );
}

// ─── SHARED UI ──────────────────────────────────────────────

const cardStyle = {
  background: "rgba(255,255,255,0.02)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 14,
  padding: 24,
} as const;

const inputStyle = {
  padding: "8px 12px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  color: "#F5F5F0",
  fontSize: 14,
  fontFamily: "inherit",
} as const;

const btnPrimary = {
  padding: "10px 20px",
  background: "#B87333",
  color: "#0F0F12",
  border: "none",
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 800,
  letterSpacing: 0.3,
  textTransform: "uppercase" as const,
  cursor: "pointer",
};

const btnSecondary = {
  padding: "10px 20px",
  background: "rgba(255,255,255,0.06)",
  color: "#F5F5F0",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: 0.3,
  textTransform: "uppercase" as const,
  cursor: "pointer",
};

const btnSmall = {
  padding: "6px 12px",
  background: "rgba(184,115,51,0.18)",
  color: "#F5E9DA",
  border: "1px solid rgba(184,115,51,0.42)",
  borderRadius: 6,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 0.3,
  textTransform: "uppercase" as const,
  cursor: "pointer",
};

function Filter({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 10, color: "rgba(245,245,240,0.5)", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>{label}</label>
      {children}
    </div>
  );
}

function Preset({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: "6px 12px", background: "transparent",
      border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6,
      color: "rgba(245,245,240,0.7)", fontSize: 12, fontWeight: 600, cursor: "pointer",
    }}>{label}</button>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: "rgba(245,245,240,0.5)", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color, marginTop: 6 }}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: Payout["status"] }) {
  const map: Record<Payout["status"], { bg: string; border: string; color: string }> = {
    PENDING:   { bg: "rgba(234,179,8,0.12)",  border: "rgba(234,179,8,0.3)",  color: "#FDE68A" },
    PAID:      { bg: "rgba(34,197,94,0.12)",  border: "rgba(34,197,94,0.3)",  color: "#86EFAC" },
    CANCELLED: { bg: "rgba(107,114,128,0.12)",border: "rgba(107,114,128,0.3)",color: "#9CA3AF" },
  };
  const s = map[status];
  return (
    <span style={{ padding: "4px 10px", background: s.bg, border: `1px solid ${s.border}`, color: s.color, borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
      {status}
    </span>
  );
}

function Th({ children, align = "left" }: { children?: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th style={{ padding: "12px 12px", textAlign: align, fontSize: 10, fontWeight: 800, letterSpacing: 2, color: "rgba(245,245,240,0.5)", textTransform: "uppercase" }}>
      {children}
    </th>
  );
}

function Td({
  children, align = "left", mono, style,
}: {
  children?: React.ReactNode;
  align?: "left" | "right";
  mono?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <td style={{ padding: "12px 12px", textAlign: align, fontSize: 14, color: "#F5F5F0", fontFamily: mono ? "ui-monospace, Menlo, monospace" : "inherit", ...style }}>
      {children}
    </td>
  );
}
