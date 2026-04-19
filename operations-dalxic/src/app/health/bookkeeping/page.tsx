"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import { HealthShell } from "@/components/ops/HealthShell"
import { useAuth } from "@/lib/use-auth"
import { Page, Stat, Pill, Drawer, Tabs, DataTable, Card, T, SearchBar, Section, Empty } from "@/components/ops/primitives"
import { money } from "@/lib/ops/format"

type View = "patients" | "revenue" | "outstanding" | "departments" | "daily"

interface Receipt {
  id: string; code: string; cartId: string; subtotal: number; discountTotal: number
  taxTotal: number; grandTotal: number; paymentMethod: string; createdAt: string
  items: { itemName: string; unitPrice: number; quantity: number; total: number }[]
}

interface Cart {
  id: string; contactId: string | null; status: string; createdAt: string
  items: { id: string; itemName: string; unitPrice: number; quantity: number; tax: number; total: number; serviceItemId: string }[]
}

interface Contact { id: string; name: string; phone?: string; insuranceType?: string }

interface PatientBilling {
  id: string; name: string; phone: string; insurance: string
  totalBilled: number; totalPaid: number; outstanding: number
  visits: number
}

export default function BookkeepingPage() {
  const { session, authFetch } = useAuth()
  const [view, setView] = useState<View>("patients")
  const [query, setQuery] = useState("")
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [carts, setCarts] = useState<Cart[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activePatient, setActivePatient] = useState<PatientBilling | null>(null)

  const fetchData = useCallback(async () => {
    if (!session) return; setLoading(true)
    try {
      const [receiptRes, cartRes, contactsRes] = await Promise.all([
        authFetch("/api/receipts"),
        authFetch("/api/cart?status=paid"),
        authFetch("/api/contacts"),
      ])
      const [receiptJson, cartJson, contactsJson] = await Promise.all([
        receiptRes.json(), cartRes.json(), contactsRes.json(),
      ])

      if (receiptJson.success) setReceipts(receiptJson.data)
      if (cartJson.success) setCarts(cartJson.data)
      if (contactsJson.success) setContacts(contactsJson.data)
      setError(null)
    } catch { setError("Network Error") } finally { setLoading(false) }
  }, [session, authFetch])

  useEffect(() => { if (session) fetchData() }, [session, fetchData])

  const totalRevenue = receipts.reduce((s, r) => s + r.grandTotal, 0)
  const totalTax = receipts.reduce((s, r) => s + r.taxTotal, 0)

  const patientBillings = useMemo(() => {
    const map = new Map<string, PatientBilling>()
    const contactMap = new Map<string, Contact>()
    for (const c of contacts) contactMap.set(c.id, c)

    for (const cart of carts) {
      if (!cart.contactId) continue
      const contact = contactMap.get(cart.contactId)
      if (!map.has(cart.contactId)) {
        map.set(cart.contactId, {
          id: cart.contactId, name: contact?.name || "Unknown",
          phone: contact?.phone || "—", insurance: contact?.insuranceType || "None",
          totalBilled: 0, totalPaid: 0, outstanding: 0, visits: 0,
        })
      }
      const pb = map.get(cart.contactId)!
      const cartTotal = cart.items.reduce((s, i) => s + i.total, 0)
      pb.totalBilled += cartTotal
      if (cart.status === "paid") pb.totalPaid += cartTotal
      pb.visits++
    }
    for (const pb of map.values()) pb.outstanding = pb.totalBilled - pb.totalPaid
    return Array.from(map.values())
  }, [carts, contacts])

  const outstandingTotal = patientBillings.reduce((s, p) => s + p.outstanding, 0)
  const avgPerPatient = patientBillings.length > 0 ? Math.round(totalRevenue / patientBillings.length) : 0

  const paymentBreakdown = useMemo(() => {
    const methods: Record<string, number> = {}
    for (const r of receipts) {
      const method = r.paymentMethod || "Cash"
      methods[method] = (methods[method] || 0) + r.grandTotal
    }
    return Object.entries(methods).sort((a, b) => b[1] - a[1])
  }, [receipts])

  const departmentRevenue = useMemo(() => {
    const depts: Record<string, { count: number; revenue: number }> = {}
    for (const r of receipts) {
      for (const item of r.items) {
        const dept = item.itemName.includes("Consult") ? "Consultation" : item.itemName.includes("Lab") ? "Laboratory" : item.itemName.includes("Imaging") || item.itemName.includes("X-Ray") || item.itemName.includes("CT") ? "Imaging" : "Pharmacy"
        if (!depts[dept]) depts[dept] = { count: 0, revenue: 0 }
        depts[dept].count++
        depts[dept].revenue += item.total
      }
    }
    return Object.entries(depts).sort((a, b) => b[1].revenue - a[1].revenue)
  }, [receipts])

  const filteredPatients = useMemo(() => {
    if (!query) return patientBillings
    const q = query.toLowerCase()
    return patientBillings.filter(p => p.name.toLowerCase().includes(q) || p.phone.includes(q))
  }, [patientBillings, query])

  const maxRevenue = departmentRevenue.length > 0 ? Math.max(...departmentRevenue.map(d => d[1].revenue)) : 1

  return (
    <HealthShell>
      <Page accent="copper" title="Bookkeeping" subtitle="Patient Billing, Revenue Tracking, Department Analysis And Financial Overview.">
        {error && <div style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 8, padding: "10px 16px", marginBottom: 16, color: "#f87171", fontSize: 13, fontWeight: 600 }}>{error}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Total Revenue" value={money(totalRevenue)} accent="copper" icon="billing" />
          <Stat label="Outstanding" value={money(outstandingTotal)} accent={outstandingTotal > 0 ? "amber" : "emerald"} icon="trending" />
          <Stat label="Avg Per Patient" value={money(avgPerPatient)} accent="copper" icon="customers" />
          <Stat label="Total Receipts" value={receipts.length} accent="emerald" icon="check" />
        </div>

        <Section title="Financial Management" action={<div style={{ width: 260 }}><SearchBar value={query} onChange={setQuery} placeholder="Search Patient…" /></div>}>
          <Tabs<View> value={view} onChange={setView} accent="copper" tabs={[
            { key: "patients", label: "Patient Billing", count: patientBillings.length },
            { key: "revenue", label: "Revenue Breakdown" },
            { key: "outstanding", label: "Outstanding", count: patientBillings.filter(p => p.outstanding > 0).length },
            { key: "departments", label: "Departments" },
            { key: "daily", label: "Daily Summary" },
          ]} />

          <div style={{ marginTop: 18 }}>
            {loading ? <div style={{ textAlign: "center", padding: 48, color: T.txD, fontSize: 13, fontWeight: 600 }}>Loading…</div> : view === "patients" ? (
              filteredPatients.length === 0 ? <Empty icon="search" title="No Patient Billing" sub="Patient billing data will appear here after transactions." /> : (
                <DataTable
                  columns={[
                    { key: "name", label: "Patient", render: (p: PatientBilling) => <span style={{ fontWeight: 700 }}>{p.name}</span> },
                    { key: "phone", label: "Phone", width: 120, render: (p: PatientBilling) => p.phone },
                    { key: "insurance", label: "Insurance", width: 90, render: (p: PatientBilling) => <Pill tone={p.insurance !== "None" ? "sky" : "neutral"}>{p.insurance}</Pill> },
                    { key: "visits", label: "Visits", width: 70, render: (p: PatientBilling) => p.visits },
                    { key: "totalBilled", label: "Billed", width: 110, render: (p: PatientBilling) => money(p.totalBilled) },
                    { key: "totalPaid", label: "Paid", width: 110, render: (p: PatientBilling) => <span style={{ color: T.emerald }}>{money(p.totalPaid)}</span> },
                    { key: "outstanding", label: "Outstanding", width: 110, render: (p: PatientBilling) => p.outstanding > 0 ? <span style={{ color: T.red, fontWeight: 700 }}>{money(p.outstanding)}</span> : <span style={{ color: T.emerald }}>—</span> },
                  ]}
                  rows={filteredPatients}
                  onRowClick={(p) => setActivePatient(p as PatientBilling)}
                />
              )
            ) : view === "revenue" ? (
              <Card padding={24}>
                <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 16 }}>Revenue By Payment Method</div>
                {paymentBreakdown.length === 0 ? (
                  <div style={{ color: T.txD, fontSize: 13 }}>No revenue data yet.</div>
                ) : (
                  paymentBreakdown.map(([method, amount]) => (
                    <div key={method} style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 13, color: T.tx, fontWeight: 600 }}>{method}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: T.tx }}>{money(amount)}</span>
                      </div>
                      <div style={{ height: 8, background: T.surface, borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(amount / totalRevenue) * 100}%`, background: T.copper, borderRadius: 4 }} />
                      </div>
                    </div>
                  ))
                )}
                <div style={{ marginTop: 20, paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: T.txM }}>Total Tax Collected</span>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{money(totalTax)}</span>
                  </div>
                </div>
              </Card>
            ) : view === "outstanding" ? (
              patientBillings.filter(p => p.outstanding > 0).length === 0 ? (
                <Empty icon="check" title="No Outstanding Balances" sub="All patients are paid up." />
              ) : (
                <DataTable
                  columns={[
                    { key: "name", label: "Patient", render: (p: PatientBilling) => <span style={{ fontWeight: 700 }}>{p.name}</span> },
                    { key: "phone", label: "Phone", width: 120, render: (p: PatientBilling) => p.phone },
                    { key: "outstanding", label: "Outstanding", width: 120, render: (p: PatientBilling) => <span style={{ color: T.red, fontWeight: 800, fontSize: 15 }}>{money(p.outstanding)}</span> },
                    { key: "totalBilled", label: "Total Billed", width: 110, render: (p: PatientBilling) => money(p.totalBilled) },
                    { key: "totalPaid", label: "Total Paid", width: 110, render: (p: PatientBilling) => money(p.totalPaid) },
                  ]}
                  rows={patientBillings.filter(p => p.outstanding > 0).sort((a, b) => b.outstanding - a.outstanding)}
                  onRowClick={(p) => setActivePatient(p as PatientBilling)}
                />
              )
            ) : view === "departments" ? (
              <Card padding={24}>
                <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 16 }}>Revenue By Department</div>
                {departmentRevenue.length === 0 ? (
                  <div style={{ color: T.txD, fontSize: 13 }}>No department data yet.</div>
                ) : (
                  departmentRevenue.map(([dept, data]) => (
                    <div key={dept} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <div>
                          <span style={{ fontSize: 13, color: T.tx, fontWeight: 700 }}>{dept}</span>
                          <span style={{ fontSize: 11, color: T.txD, marginLeft: 8 }}>{data.count} items</span>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 800, color: T.tx }}>{money(data.revenue)}</span>
                      </div>
                      <div style={{ height: 8, background: T.surface, borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(data.revenue / maxRevenue) * 100}%`, background: T.copper, borderRadius: 4 }} />
                      </div>
                    </div>
                  ))
                )}
              </Card>
            ) : (
              /* Daily Summary */
              <Card padding={24}>
                <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 16 }}>Today Summary</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div style={{ background: T.surface, borderRadius: 8, padding: 16, textAlign: "center" }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: T.copper }}>{money(totalRevenue)}</div>
                    <div style={{ fontSize: 10, color: T.txD, textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4 }}>Total Revenue</div>
                  </div>
                  <div style={{ background: T.surface, borderRadius: 8, padding: 16, textAlign: "center" }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: T.tx }}>{receipts.length}</div>
                    <div style={{ fontSize: 10, color: T.txD, textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4 }}>Transactions</div>
                  </div>
                  <div style={{ background: T.surface, borderRadius: 8, padding: 16, textAlign: "center" }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: T.emerald }}>{money(totalTax)}</div>
                    <div style={{ fontSize: 10, color: T.txD, textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4 }}>Tax Collected</div>
                  </div>
                  <div style={{ background: T.surface, borderRadius: 8, padding: 16, textAlign: "center" }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: outstandingTotal > 0 ? T.red : T.emerald }}>{money(outstandingTotal)}</div>
                    <div style={{ fontSize: 10, color: T.txD, textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4 }}>Outstanding</div>
                  </div>
                </div>

                {receipts.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Recent Receipts</div>
                    {receipts.slice(0, 10).map(r => (
                      <div key={r.id} style={{ padding: "8px 0", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 700, color: T.copper, fontSize: 12 }}>{r.code}</span>
                          <span style={{ fontSize: 11, color: T.txD, marginLeft: 10 }}>{r.items.length} items</span>
                        </div>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: 13 }}>{money(r.grandTotal)}</span>
                          <span style={{ fontSize: 11, color: T.txD, marginLeft: 8 }}>{r.paymentMethod || "Cash"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>
        </Section>
      </Page>

      <Drawer open={!!activePatient} onClose={() => setActivePatient(null)} title={activePatient?.name ?? "Patient"} subtitle={activePatient?.phone} width={480}>
        {activePatient && (
          <>
            <Card padding={18} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: T.txD, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700, fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>Billing Summary</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                <div style={{ background: T.surface, borderRadius: 8, padding: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: T.tx }}>{money(activePatient.totalBilled)}</div>
                  <div style={{ fontSize: 10, color: T.txD, textTransform: "uppercase", marginTop: 4 }}>Billed</div>
                </div>
                <div style={{ background: T.surface, borderRadius: 8, padding: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: T.emerald }}>{money(activePatient.totalPaid)}</div>
                  <div style={{ fontSize: 10, color: T.txD, textTransform: "uppercase", marginTop: 4 }}>Paid</div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Insurance:</b> <Pill tone={activePatient.insurance !== "None" ? "sky" : "neutral"}>{activePatient.insurance}</Pill></div>
              <div style={{ fontSize: 13, color: T.tx, marginBottom: 6 }}><b>Visits:</b> {activePatient.visits}</div>
              {activePatient.outstanding > 0 && (
                <div style={{ fontSize: 14, fontWeight: 800, color: T.red, marginTop: 10 }}>Outstanding: {money(activePatient.outstanding)}</div>
              )}
            </Card>
          </>
        )}
      </Drawer>
    </HealthShell>
  )
}
