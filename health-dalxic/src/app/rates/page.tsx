"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { StationGate } from "@/components/station-gate";
import type { OperatorSession } from "@/types";
import { useHospitalCode } from "@/hooks/use-hospital-code";

const COPPER = "#B87333";
const COPPER_SOFT = "rgba(184,115,51,0.14)";
const COPPER_BORDER = "rgba(184,115,51,0.38)";
const SURFACE = "#15151A";
const BORDER = "rgba(255,255,255,0.08)";
const BG = "#0F0F12";
const INK = "#F5F5F0";
const MUTED = "rgba(245,245,240,0.55)";

const SERVICE_TYPES = ["CONSULTATION", "LAB", "IMAGING", "PROCEDURE", "DRUG", "WARD_DAY", "ICU_DAY", "EMERGENCY"] as const;
const BED_CLASSES = ["General", "Semi-Private", "Private", "ICU", "VIP"] as const;

type Doctor = { id: string; name: string; specialty: string; department: string | null; consultationFee: number | null; commissionRate: number | null };
type Ward = { id: string; name: string; type: string; isActive: boolean };
type Pricing = {
  defaults?: { consultationFee?: number; wardNightly?: number; injectionFee?: number; vitalsFee?: number; [k: string]: number | undefined };
  doctors?: Record<string, { fee?: number; commission?: number; department?: string }>;
  wards?: Record<string, Record<string, number>>;
  services?: Record<string, Record<string, number>>;
};

type Bundle = { pricing: Pricing; doctors: Doctor[]; wards: Ward[] };

export default function RatesPage() {
  const HOSPITAL_CODE = useHospitalCode();
  return (
    <StationGate
      hospitalCode={HOSPITAL_CODE}
      stationName="Pricing Control"
      stationIcon="💲"
      moduleKey="admin"
      allowedRoles={["admin", "super_admin", "owner", "hospital_admin", "billing"]}
    >
      {(operator) => <RatesContent operator={operator} />}
    </StationGate>
  );
}

type SectionId = "defaults" | "doctors" | "wards" | "services";

function RatesContent({ operator }: { operator: OperatorSession }) {
  const HOSPITAL_CODE = useHospitalCode();
  const [section, setSection] = useState<SectionId>("defaults");
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pricing?hospitalCode=${HOSPITAL_CODE}`);
      const data = await res.json();
      if (res.ok) setBundle(data);
    } finally {
      setLoading(false);
    }
  }, [HOSPITAL_CODE]);

  useEffect(() => { reload(); }, [reload]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const post = useCallback(async (body: Record<string, unknown>) => {
    const res = await fetch("/api/pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hospitalCode: HOSPITAL_CODE, performedBy: operator.operatorName, ...body }),
    });
    const data = await res.json();
    if (!res.ok) {
      setToast(`Error: ${data.error || "Save failed"}`);
      return false;
    }
    await reload();
    setToast("Saved");
    return true;
  }, [operator.operatorName, reload, HOSPITAL_CODE]);

  return (
    <div style={{ minHeight: "100vh", background: BG, color: INK, paddingBottom: 64 }}>
      <header style={{ padding: "32px 40px 16px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ color: COPPER, fontSize: 12, letterSpacing: 2, fontWeight: 800, textTransform: "uppercase" }}>Finance · Control</div>
            <h1 style={{ fontSize: 36, fontWeight: 800, margin: "4px 0 0", letterSpacing: -1 }}>Pricing Control</h1>
            <div style={{ fontSize: 13, color: MUTED, marginTop: 6 }}>
              One place for every fee — defaults, per-doctor charges, ward nightly rates, and service prices.
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Link
              href="/finance"
              style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${BORDER}`, color: INK, fontSize: 12, fontWeight: 700, textDecoration: "none" }}
            >
              ← Finance
            </Link>
            <div style={{ fontSize: 13, color: MUTED }}>
              Signed in as <span style={{ color: INK, fontWeight: 700 }}>{operator.operatorName}</span>
            </div>
          </div>
        </div>

        <nav style={{ display: "flex", gap: 4, marginTop: 24 }}>
          {(["defaults", "doctors", "wards", "services"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSection(s)}
              style={{
                padding: "10px 20px",
                background: section === s ? COPPER_SOFT : "transparent",
                border: section === s ? `1px solid ${COPPER_BORDER}` : `1px solid ${BORDER}`,
                borderRadius: 10,
                color: section === s ? "#F5E9DA" : "rgba(245,245,240,0.7)",
                fontSize: 13, fontWeight: 700, letterSpacing: 0.3, textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              {s === "defaults" ? "Defaults" : s === "doctors" ? "Doctors" : s === "wards" ? "Wards & Beds" : "Services"}
            </button>
          ))}
        </nav>
      </header>

      <main style={{ padding: 40 }}>
        {loading && !bundle && <div style={{ color: MUTED }}>Loading…</div>}
        {bundle && section === "defaults" && <DefaultsSection pricing={bundle.pricing} onSave={(d) => post({ action: "set_defaults", defaults: d })} />}
        {bundle && section === "doctors" && <DoctorsSection bundle={bundle} onSave={(p) => post(p)} />}
        {bundle && section === "wards" && <WardsSection bundle={bundle} onSave={(p) => post(p)} />}
        {bundle && section === "services" && <ServicesSection bundle={bundle} onSave={(p) => post(p)} />}
      </main>

      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, padding: "14px 22px", borderRadius: 10,
          background: toast.startsWith("Error") ? "rgba(220,38,38,0.18)" : COPPER_SOFT,
          border: `1px solid ${toast.startsWith("Error") ? "rgba(220,38,38,0.4)" : COPPER_BORDER}`,
          color: INK, fontSize: 13, fontWeight: 700, zIndex: 50,
        }}>{toast}</div>
      )}
    </div>
  );
}

// ─── DEFAULTS ──────────────────────────────────────────────────

function DefaultsSection({ pricing, onSave }: { pricing: Pricing; onSave: (d: Record<string, number>) => Promise<boolean> }) {
  const [form, setForm] = useState({
    consultationFee: pricing.defaults?.consultationFee ?? 0,
    wardNightly: pricing.defaults?.wardNightly ?? 0,
    injectionFee: pricing.defaults?.injectionFee ?? 0,
    vitalsFee: pricing.defaults?.vitalsFee ?? 0,
  });
  const dirty = useMemo(() =>
    form.consultationFee !== (pricing.defaults?.consultationFee ?? 0) ||
    form.wardNightly !== (pricing.defaults?.wardNightly ?? 0) ||
    form.injectionFee !== (pricing.defaults?.injectionFee ?? 0) ||
    form.vitalsFee !== (pricing.defaults?.vitalsFee ?? 0),
    [form, pricing.defaults]);

  return (
    <Box title="House Default Rates" subtitle="Applied when no per-doctor or per-service override exists.">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20, maxWidth: 720 }}>
        <Field label="In-House Consultation (¢)" hint="Used when a doctor has no dedicated fee">
          <NumInput value={form.consultationFee} onChange={(v) => setForm({ ...form, consultationFee: v })} />
        </Field>
        <Field label="Default Ward Nightly (¢)" hint="Per night when ward/bed-class has no specific rate">
          <NumInput value={form.wardNightly} onChange={(v) => setForm({ ...form, wardNightly: v })} />
        </Field>
        <Field label="Injection Fee (¢)" hint="Default nurse-administered injection charge">
          <NumInput value={form.injectionFee} onChange={(v) => setForm({ ...form, injectionFee: v })} />
        </Field>
        <Field label="Vitals Fee (¢)" hint="Optional — leave 0 if vitals are bundled with consultation">
          <NumInput value={form.vitalsFee} onChange={(v) => setForm({ ...form, vitalsFee: v })} />
        </Field>
      </div>
      <div style={{ marginTop: 24 }}>
        <PrimaryBtn disabled={!dirty} onClick={() => onSave(form)}>Save Defaults</PrimaryBtn>
      </div>
    </Box>
  );
}

// ─── DOCTORS ───────────────────────────────────────────────────

function DoctorsSection({ bundle, onSave }: { bundle: Bundle; onSave: (p: Record<string, unknown>) => Promise<boolean> }) {
  const overrides = bundle.pricing.doctors || {};
  const [draft, setDraft] = useState<Record<string, { fee: string; commission: string; department: string }>>({});

  function getDraft(d: Doctor) {
    return draft[d.id] || {
      fee: overrides[d.id]?.fee != null ? String(overrides[d.id].fee) : "",
      commission: overrides[d.id]?.commission != null ? String(overrides[d.id].commission) : "",
      department: overrides[d.id]?.department ?? d.department ?? "",
    };
  }

  function setDraftField(id: string, key: "fee" | "commission" | "department", val: string) {
    setDraft({ ...draft, [id]: { ...getDraft(bundle.doctors.find((x) => x.id === id)!), [key]: val } });
  }

  async function saveRow(d: Doctor) {
    const v = getDraft(d);
    const ok = await onSave({
      action: "set_doctor",
      doctorId: d.id,
      fee: v.fee === "" ? null : Number(v.fee),
      commission: v.commission === "" ? null : Number(v.commission),
      department: v.department === "" ? null : v.department,
    });
    if (ok) setDraft((prev) => { const n = { ...prev }; delete n[d.id]; return n; });
  }

  const defaultFee = bundle.pricing.defaults?.consultationFee ?? null;

  return (
    <Box title="Per-Doctor Rates" subtitle={defaultFee != null ? `In-house default: ¢${defaultFee}. Doctors with empty fee charge the default.` : "Set the in-house default in the Defaults tab so doctors without dedicated rates have a fallback."}>
      {bundle.doctors.length === 0 ? (
        <div style={{ color: MUTED, fontSize: 13 }}>No doctors registered yet.</div>
      ) : (
        <div style={{ display: "grid", gap: 1, background: BORDER, borderRadius: 12, overflow: "hidden", border: `1px solid ${BORDER}` }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1.4fr 1fr 1fr 1fr 110px", gap: 1, background: BORDER }}>
            {["Doctor", "Department", "Fee (¢)", "Commission (%)", "Mode", ""].map((h, i) => (
              <div key={i} style={{ background: SURFACE, padding: "12px 14px", fontSize: 11, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", color: MUTED }}>{h}</div>
            ))}
          </div>
          {bundle.doctors.map((d) => {
            const v = getDraft(d);
            const dirty = !!draft[d.id];
            const overrideFee = v.fee !== "" ? Number(v.fee) : null;
            const isDefault = overrideFee == null;
            return (
              <div key={d.id} style={{ display: "grid", gridTemplateColumns: "2fr 1.4fr 1fr 1fr 1fr 110px", gap: 1, background: BORDER }}>
                <div style={{ background: SURFACE, padding: "14px", fontSize: 14 }}>
                  <div style={{ fontWeight: 700 }}>{d.name}</div>
                  <div style={{ fontSize: 11, color: MUTED, textTransform: "capitalize" }}>{d.specialty}</div>
                </div>
                <div style={{ background: SURFACE, padding: "10px 14px" }}>
                  <input value={v.department} onChange={(e) => setDraftField(d.id, "department", e.target.value)} placeholder="e.g. general" style={inputStyle} />
                </div>
                <div style={{ background: SURFACE, padding: "10px 14px" }}>
                  <input type="number" value={v.fee} onChange={(e) => setDraftField(d.id, "fee", e.target.value)} placeholder={defaultFee != null ? String(defaultFee) : "—"} style={inputStyle} />
                </div>
                <div style={{ background: SURFACE, padding: "10px 14px" }}>
                  <input type="number" value={v.commission} onChange={(e) => setDraftField(d.id, "commission", e.target.value)} placeholder="0" style={inputStyle} />
                </div>
                <div style={{ background: SURFACE, padding: "14px", display: "flex", alignItems: "center" }}>
                  {isDefault ? (
                    <span style={pillStyle("rgba(255,255,255,0.06)", MUTED)}>House Rate</span>
                  ) : (
                    <span style={pillStyle(COPPER_SOFT, "#F5E9DA")}>Dedicated</span>
                  )}
                </div>
                <div style={{ background: SURFACE, padding: "10px 14px", display: "flex", alignItems: "center" }}>
                  <button
                    onClick={() => saveRow(d)}
                    disabled={!dirty}
                    style={{
                      width: "100%", padding: "8px 0", borderRadius: 8,
                      border: `1px solid ${dirty ? COPPER_BORDER : BORDER}`,
                      background: dirty ? COPPER_SOFT : "transparent",
                      color: dirty ? "#F5E9DA" : MUTED,
                      fontSize: 12, fontWeight: 700, cursor: dirty ? "pointer" : "default",
                    }}
                  >
                    {dirty ? "Save" : "Saved"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Box>
  );
}

// ─── WARDS & BEDS ──────────────────────────────────────────────

function WardsSection({ bundle, onSave }: { bundle: Bundle; onSave: (p: Record<string, unknown>) => Promise<boolean> }) {
  const wardsByName = bundle.pricing.wards || {};
  const allNames = Array.from(new Set([...bundle.wards.map((w) => w.name), ...Object.keys(wardsByName)]));

  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [draftClass, setDraftClass] = useState<string>(BED_CLASSES[0]);
  const [draftRate, setDraftRate] = useState<string>("");
  const [customWard, setCustomWard] = useState<string>("");

  const allWardOptions = allNames.length > 0 ? allNames : [];
  const defaultRate = bundle.pricing.defaults?.wardNightly ?? null;

  async function addClass(wardName: string) {
    const rate = Number(draftRate);
    if (!wardName || !draftClass || !Number.isFinite(rate) || rate <= 0) return;
    const ok = await onSave({ action: "set_ward", wardName, bedClass: draftClass, rate });
    if (ok) {
      setDraftRate("");
      setAddingFor(null);
      setCustomWard("");
    }
  }

  async function removeClass(wardName: string, bedClass: string) {
    if (!confirm(`Remove ${bedClass} pricing from ${wardName}?`)) return;
    await onSave({ action: "delete_ward_class", wardName, bedClass });
  }

  return (
    <Box title="Ward & Bed Pricing" subtitle={defaultRate != null ? `Default ward nightly: ¢${defaultRate}. Override per ward, per bed class.` : "Set per-ward, per-bed-class nightly rates. Default applies when no specific rate exists."}>
      {/* Add new ward (custom) */}
      <div style={{ marginBottom: 24, padding: 18, border: `1px dashed ${BORDER}`, borderRadius: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", color: MUTED, marginBottom: 10 }}>Add Pricing</div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr", gap: 12 }}>
          <select value={addingFor || ""} onChange={(e) => setAddingFor(e.target.value || null)} style={inputStyle}>
            <option value="">Select ward…</option>
            {allWardOptions.map((n) => <option key={n} value={n}>{n}</option>)}
            <option value="__custom">+ New ward name…</option>
          </select>
          {addingFor === "__custom" && (
            <input value={customWard} onChange={(e) => setCustomWard(e.target.value)} placeholder="Ward name" style={inputStyle} />
          )}
          {addingFor !== "__custom" && (
            <select value={draftClass} onChange={(e) => setDraftClass(e.target.value)} style={inputStyle}>
              {BED_CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          {addingFor === "__custom" && (
            <select value={draftClass} onChange={(e) => setDraftClass(e.target.value)} style={inputStyle}>
              {BED_CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          <input type="number" value={draftRate} onChange={(e) => setDraftRate(e.target.value)} placeholder="Rate per night ¢" style={inputStyle} />
          <PrimaryBtn
            disabled={!(addingFor && (addingFor !== "__custom" || customWard) && draftRate && Number(draftRate) > 0)}
            onClick={() => addClass(addingFor === "__custom" ? customWard : (addingFor || ""))}
          >
            Add
          </PrimaryBtn>
        </div>
      </div>

      {/* Existing pricing */}
      {Object.keys(wardsByName).length === 0 ? (
        <div style={{ color: MUTED, fontSize: 13 }}>No ward pricing set yet.</div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {Object.entries(wardsByName).map(([wardName, classes]) => {
            const wardMeta = bundle.wards.find((w) => w.name === wardName);
            return (
              <div key={wardName} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 18 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>{wardName}</div>
                    {wardMeta && <div style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: 0.6 }}>{wardMeta.type}</div>}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
                  {Object.entries(classes).map(([cls, rate]) => (
                    <div key={cls} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: BG, border: `1px solid ${BORDER}`, borderRadius: 10 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{cls}</div>
                        <div style={{ fontSize: 11, color: MUTED }}>per night</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: COPPER }}>¢{rate}</div>
                        <button onClick={() => removeClass(wardName, cls)} title="Remove" style={{ background: "transparent", border: "none", color: MUTED, cursor: "pointer", fontSize: 14 }}>×</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Box>
  );
}

// ─── SERVICES ──────────────────────────────────────────────────

function ServicesSection({ bundle, onSave }: { bundle: Bundle; onSave: (p: Record<string, unknown>) => Promise<boolean> }) {
  const services = bundle.pricing.services || {};
  const [type, setType] = useState<string>(SERVICE_TYPES[1]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  async function add() {
    const p = Number(price);
    if (!type || !name.trim() || !Number.isFinite(p) || p <= 0) return;
    const ok = await onSave({ action: "set_service", serviceType: type, name: name.trim(), price: p });
    if (ok) { setName(""); setPrice(""); }
  }

  async function remove(serviceType: string, n: string) {
    if (!confirm(`Remove ${n} (${serviceType})?`)) return;
    await onSave({ action: "delete_service", serviceType, name: n });
  }

  return (
    <Box title="Service Catalog" subtitle="Per-service prices for lab, imaging, procedures, drugs, and named consultations.">
      {/* Add row */}
      <div style={{ marginBottom: 24, padding: 18, border: `1px dashed ${BORDER}`, borderRadius: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", color: MUTED, marginBottom: 10 }}>Add / Update Service Price</div>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr 1fr 1fr", gap: 12 }}>
          <select value={type} onChange={(e) => setType(e.target.value)} style={inputStyle}>
            {SERVICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Malaria RDT, Chest X-Ray" style={inputStyle} />
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price ¢" style={inputStyle} />
          <PrimaryBtn disabled={!name.trim() || !price || Number(price) <= 0} onClick={add}>Save</PrimaryBtn>
        </div>
      </div>

      {Object.keys(services).length === 0 ? (
        <div style={{ color: MUTED, fontSize: 13 }}>No service prices set yet. Add the first one above.</div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {SERVICE_TYPES.filter((t) => services[t]).map((t) => (
            <div key={t} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.6, color: COPPER, marginBottom: 12 }}>{t}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8 }}>
                {Object.entries(services[t]).map(([n, p]) => (
                  <div key={n} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: BG, border: `1px solid ${BORDER}`, borderRadius: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{n}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: COPPER }}>¢{p}</div>
                      <button onClick={() => remove(t, n)} title="Remove" style={{ background: "transparent", border: "none", color: MUTED, cursor: "pointer", fontSize: 14 }}>×</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Box>
  );
}

// ─── PRIMITIVES ────────────────────────────────────────────────

function Box({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 28, marginBottom: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: -0.3 }}>{title}</h2>
        {subtitle && <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>{subtitle}</div>}
      </div>
      {children}
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase", color: MUTED, marginBottom: 6 }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 8,
  background: BG, border: `1px solid ${BORDER}`, color: INK, fontSize: 14,
  outline: "none", fontFamily: "inherit",
};

function NumInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
      style={inputStyle}
    />
  );
}

function PrimaryBtn({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "12px 22px", borderRadius: 10,
        background: disabled ? "rgba(255,255,255,0.04)" : COPPER_SOFT,
        border: `1px solid ${disabled ? BORDER : COPPER_BORDER}`,
        color: disabled ? MUTED : "#F5E9DA",
        fontSize: 13, fontWeight: 800, letterSpacing: 0.4, textTransform: "uppercase",
        cursor: disabled ? "default" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

function pillStyle(bg: string, color: string): React.CSSProperties {
  return {
    display: "inline-block", padding: "4px 10px", borderRadius: 999,
    background: bg, color, fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase",
  };
}
