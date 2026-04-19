"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { T, Page, Stat, Tabs, SearchBar, Select, DataTable, Pill, Drawer, Modal, Button, Field, Input, Card } from "@/components/ops/primitives"
import type { Column } from "@/components/ops/primitives"
import { dateShort } from "@/lib/ops/format"
import { useAuth } from "@/lib/use-auth"
import type { MockTenant } from "@/lib/ops/mock"

type Accent = "amber" | "copper" | "sky" | "emerald"

interface Contact {
  id: string
  name: string
  phone: string
  email: string
  type: string
  gender: "Male" | "Female"
  group: string
  dob: string
  bloodGroup?: string
  allergies?: string
  address?: string
  created: string
}

const DEMO_CONTACTS: Contact[] = [
  { id: "CT-001", name: "Akosua Mensah", phone: "+233 24 555 0101", email: "akosua@email.com", type: "Patient", gender: "Female", group: "General", dob: "1988-03-12", bloodGroup: "O+", allergies: "Penicillin", address: "Osu, Accra", created: "2025-09-14" },
  { id: "CT-002", name: "Kwame Asante", phone: "+233 20 555 0102", email: "kwame.a@email.com", type: "Patient", gender: "Male", group: "VIP", dob: "1975-07-22", bloodGroup: "A+", address: "East Legon, Accra", created: "2025-02-04" },
  { id: "CT-003", name: "Ama Owusu", phone: "+233 26 555 0103", email: "ama.owusu@email.com", type: "Patient", gender: "Female", group: "General", dob: "1992-11-05", bloodGroup: "B+", allergies: "Sulfa drugs", address: "Tema, Accra", created: "2025-08-19" },
  { id: "CT-004", name: "Yaw Boateng", phone: "+233 54 555 0104", email: "yaw.b@email.com", type: "Staff", gender: "Male", group: "Nursing", dob: "1985-01-30", address: "Madina, Accra", created: "2024-11-02" },
  { id: "CT-005", name: "Esi Nyarko", phone: "+233 27 555 0105", email: "esi.n@email.com", type: "Patient", gender: "Female", group: "NHIS", dob: "1998-06-18", bloodGroup: "AB-", address: "Kasoa", created: "2025-12-01" },
  { id: "CT-006", name: "Kofi Acquah", phone: "+233 24 555 0108", email: "kofi.a@email.com", type: "Supplier", gender: "Male", group: "Pharma", dob: "1980-09-25", address: "Kumasi", created: "2024-10-30" },
  { id: "CT-007", name: "Adwoa Pokuaa", phone: "+233 50 555 0107", email: "adwoa.p@email.com", type: "Patient", gender: "Female", group: "VIP", dob: "1990-04-14", bloodGroup: "O-", address: "Airport Residential, Accra", created: "2024-04-11" },
  { id: "CT-008", name: "Nana Kweku Addo", phone: "+233 24 555 0110", email: "nk.addo@email.com", type: "Staff", gender: "Male", group: "Doctors", dob: "1978-12-08", address: "Cantonments, Accra", created: "2024-12-19" },
  { id: "CT-009", name: "Abena Sarpong", phone: "+233 27 555 0109", email: "abena.s@email.com", type: "Patient", gender: "Female", group: "NHIS", dob: "1995-08-22", bloodGroup: "A-", allergies: "Latex", address: "Spintex, Accra", created: "2025-06-08" },
  { id: "CT-010", name: "Sister Comfort", phone: "+233 24 555 0111", email: "", type: "Patient", gender: "Female", group: "General", dob: "1968-02-14", bloodGroup: "B-", address: "Dansoman, Accra", created: "2025-07-22" },
  { id: "CT-011", name: "Jessica Tetteh", phone: "+233 50 555 0112", email: "jess.t@email.com", type: "Patient", gender: "Female", group: "General", dob: "1993-10-03", bloodGroup: "O+", address: "Achimota, Accra", created: "2025-04-17" },
  { id: "CT-012", name: "Emmanuel Frimpong", phone: "+233 20 333 0303", email: "e.frimpong@email.com", type: "Supplier", gender: "Male", group: "Equipment", dob: "1982-05-20", address: "Kumasi", created: "2024-03-05" },
  { id: "CT-013", name: "Maame Afua Darko", phone: "+233 55 444 0606", email: "afua.d@email.com", type: "Patient", gender: "Female", group: "VIP", dob: "1987-07-09", bloodGroup: "AB+", address: "Labone, Accra", created: "2025-10-02" },
  { id: "CT-014", name: "Kojo Mensah-Bonsu", phone: "+233 26 777 1313", email: "kojo.mb@email.com", type: "Staff", gender: "Male", group: "Admin", dob: "1991-03-28", address: "Tema", created: "2025-03-28" },
  { id: "CT-015", name: "Akua Aboagye", phone: "+233 24 888 1515", email: "akua.ab@email.com", type: "Patient", gender: "Female", group: "General", dob: "2001-01-15", bloodGroup: "A+", address: "Takoradi", created: "2026-01-10" },
]

const TITLE_MAP: Record<string, string> = {
  health: "Patient Registry",
  institute: "Student Registry",
  trade: "Customer Book",
  restaurant: "Guest Registry",
  salon: "Client Book",
}

const TYPE_MAP: Record<string, { key: string; label: string }[]> = {
  trade: [{ key: "Customer", label: "Customer" }, { key: "Supplier", label: "Supplier" }],
  health: [{ key: "Patient", label: "Patient" }, { key: "Staff", label: "Staff" }, { key: "Supplier", label: "Supplier" }],
  institute: [{ key: "Student", label: "Student" }, { key: "Parent", label: "Parent" }, { key: "Staff", label: "Staff" }],
  restaurant: [{ key: "Guest", label: "Guest" }, { key: "Staff", label: "Staff" }],
  salon: [{ key: "Client", label: "Client" }, { key: "Staff", label: "Staff" }],
}

const TYPE_TONE: Record<string, "emerald" | "amber" | "sky" | "copper" | "neutral"> = {
  Patient: "emerald", Customer: "emerald", Student: "emerald", Guest: "emerald", Client: "emerald",
  Staff: "sky", Supplier: "copper", Parent: "amber",
}

function capitalize(s: string): string {
  if (!s) return ""
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function mapApiContact(api: Record<string, unknown>): Contact {
  return {
    id: api.id as string,
    name: api.name as string,
    phone: (api.phone as string) ?? "",
    email: (api.email as string) ?? "",
    type: capitalize(api.type as string),
    gender: capitalize((api.gender as string) ?? "") as "Male" | "Female",
    group: (api.group as { name?: string } | null)?.name ?? "",
    dob: (api.dateOfBirth as string) ?? "",
    bloodGroup: (api.bloodGroup as string) ?? "",
    allergies: Array.isArray(api.allergies) ? (api.allergies as string[]).join(", ") : "",
    address: "",
    created: api.createdAt as string,
  }
}

type TabKey = "all" | string

export function ContactsPage({ accent, tenant }: { accent: Accent; tenant: MockTenant }) {
  const { authFetch, session } = useAuth()
  const [tab, setTab] = useState<TabKey>("all")
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [selected, setSelected] = useState<Contact | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>(DEMO_CONTACTS)
  const [loading, setLoading] = useState(false)

  // Form state for Add Contact modal
  const [fName, setFName] = useState("")
  const [fPhone, setFPhone] = useState("")
  const [fEmail, setFEmail] = useState("")
  const [fType, setFType] = useState("")
  const [fGender, setFGender] = useState("")
  const [fDob, setFDob] = useState("")
  const [fBlood, setFBlood] = useState("")
  const [fGroup, setFGroup] = useState("")
  const [fAddress, setFAddress] = useState("")
  const [fAllergies, setFAllergies] = useState("")
  const [creating, setCreating] = useState(false)

  const fetchContacts = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      const res = await authFetch("/api/contacts")
      const json = await res.json()
      if (json.success && json.data?.rows) {
        setContacts(json.data.rows.map(mapApiContact))
      }
    } catch { /* demo fallback */ }
    finally { setLoading(false) }
  }, [session, authFetch])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  async function handleCreate() {
    if (!session || !fName || !fType) return
    setCreating(true)
    try {
      const res = await authFetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fName,
          phone: fPhone || undefined,
          email: fEmail || undefined,
          type: fType.toLowerCase(),
          gender: fGender ? fGender.toLowerCase() as "male" | "female" | "other" : undefined,
          dateOfBirth: fDob || undefined,
          bloodGroup: fBlood || undefined,
          allergies: fAllergies ? fAllergies.split(",").map(a => a.trim()).filter(Boolean) : undefined,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setShowAdd(false)
        setFName(""); setFPhone(""); setFEmail(""); setFType(""); setFGender("")
        setFDob(""); setFBlood(""); setFGroup(""); setFAddress(""); setFAllergies("")
        fetchContacts()
      }
    } catch { /* silent */ }
    finally { setCreating(false) }
  }

  const pageTitle = TITLE_MAP[tenant.type] ?? "Contact Book"
  const typeList = TYPE_MAP[tenant.type] ?? TYPE_MAP.trade

  const filtered = useMemo(() => {
    return contacts.filter(c => {
      if (tab !== "all" && c.type !== tab) return false
      if (typeFilter && c.type !== typeFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q)
      }
      return true
    })
  }, [contacts, tab, search, typeFilter])

  const tabItems = [
    { key: "all" as TabKey, label: "All", count: contacts.length },
    ...typeList.map(t => ({
      key: t.key as TabKey,
      label: t.label,
      count: contacts.filter(c => c.type === t.key).length,
    })),
  ]

  const topType1 = typeList[0]
  const topType2 = typeList[1]

  const columns: Column<Contact>[] = [
    { key: "name", label: "Name", width: "20%", render: (r) => <span style={{ fontWeight: 700, color: T.tx, fontSize: 13 }}>{r.name}</span> },
    { key: "phone", label: "Phone", render: (r) => <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: T.txM }}>{r.phone}</span> },
    { key: "email", label: "Email", render: (r) => <span style={{ fontSize: 12, color: T.txM }}>{r.email || "--"}</span> },
    { key: "type", label: "Type", render: (r) => <Pill tone={TYPE_TONE[r.type] ?? "neutral"}>{r.type}</Pill> },
    { key: "gender", label: "Gender", render: (r) => <span style={{ fontSize: 12, color: T.txM }}>{r.gender}</span> },
    { key: "group", label: "Group", render: (r) => <span style={{ fontSize: 12, color: T.txM }}>{r.group}</span> },
    { key: "created", label: "Created", render: (r) => <span style={{ fontSize: 12, color: T.txM }}>{dateShort(r.created)}</span> },
  ]

  return (
    <Page title={pageTitle} accent={accent} action={<Button icon="plus" onClick={() => setShowAdd(true)}>Add Contact</Button>}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <Stat label="Total" value={contacts.length} icon="customers" accent={accent} />
        {topType1 && <Stat label={topType1.label + "s"} value={contacts.filter(c => c.type === topType1.key).length} icon="user" accent="emerald" />}
        {topType2 && <Stat label={topType2.label + "s"} value={contacts.filter(c => c.type === topType2.key).length} icon="user" accent="sky" />}
        <Stat label="This Month" value={contacts.filter(c => c.created >= "2026-04-01").length} icon="calendar" accent="amber" />
      </div>

      <Tabs tabs={tabItems} value={tab} onChange={(v) => { setTab(v); setTypeFilter("") }} accent={accent} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: 12, marginBottom: 20 }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search name, phone, email..." />
        <Select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          {typeList.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
        </Select>
      </div>

      {loading && <div style={{ textAlign: "center", padding: 12, fontSize: 12, color: T.txM }}>Loading contacts...</div>}
      <DataTable rows={filtered} columns={columns} onRowClick={setSelected} empty="No contacts match your filters." />

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ""}
        subtitle={selected?.type}
        width={560}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSelected(null)}>Close</Button>
            <Button variant="outline" icon="edit">Edit</Button>
          </>
        }
      >
        {selected && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
              {[
                { label: "Phone", value: selected.phone },
                { label: "Email", value: selected.email || "Not provided" },
                { label: "Type", value: selected.type },
                { label: "Gender", value: selected.gender },
                { label: "Date of Birth", value: dateShort(selected.dob) },
                { label: "Group", value: selected.group },
              ].map(f => (
                <Card key={f.label} padding={14} accent={accent}>
                  <div style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>{f.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.tx }}>{f.value}</div>
                </Card>
              ))}
            </div>

            {(selected.bloodGroup || selected.allergies) && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: T.txD, fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>Medical Info</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {selected.bloodGroup && (
                    <Card padding={14} accent={accent}>
                      <div style={{ fontSize: 9, color: T.txD, textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>Blood Group</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: T.red, fontFamily: "'Space Grotesk', sans-serif" }}>{selected.bloodGroup}</div>
                    </Card>
                  )}
                  {selected.allergies && (
                    <Card padding={14} accent={accent}>
                      <div style={{ fontSize: 9, color: T.txD, textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>Allergies</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.amber }}>{selected.allergies}</div>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {selected.address && (
              <Card padding={14} accent={accent}>
                <div style={{ fontSize: 9, color: T.txD, textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>Address</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.tx }}>{selected.address}</div>
              </Card>
            )}
          </div>
        )}
      </Drawer>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Contact" width={600}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Full Name"><Input placeholder="e.g. Akosua Mensah" value={fName} onChange={e => setFName(e.target.value)} /></Field>
          <Field label="Phone"><Input placeholder="+233 24 555 0000" style={{ fontFamily: "'DM Mono', monospace" }} value={fPhone} onChange={e => setFPhone(e.target.value)} /></Field>
          <Field label="Email"><Input type="email" placeholder="email@example.com" value={fEmail} onChange={e => setFEmail(e.target.value)} /></Field>
          <Field label="Type">
            <Select value={fType} onChange={e => setFType(e.target.value)}>
              <option value="">Select type</option>
              {typeList.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
            </Select>
          </Field>
          <Field label="Gender">
            <Select value={fGender} onChange={e => setFGender(e.target.value)}>
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </Select>
          </Field>
          <Field label="Date of Birth"><Input type="date" value={fDob} onChange={e => setFDob(e.target.value)} /></Field>
          <Field label="Blood Group">
            <Select value={fBlood} onChange={e => setFBlood(e.target.value)}>
              <option value="">Select</option>
              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(g => <option key={g} value={g}>{g}</option>)}
            </Select>
          </Field>
          <Field label="Group"><Input placeholder="e.g. General, VIP, NHIS" value={fGroup} onChange={e => setFGroup(e.target.value)} /></Field>
          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="Address"><Input placeholder="Location or address" value={fAddress} onChange={e => setFAddress(e.target.value)} /></Field>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="Allergies"><Input placeholder="Known allergies (comma separated)" value={fAllergies} onChange={e => setFAllergies(e.target.value)} /></Field>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
          <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={creating}>{creating ? "Creating..." : "Create Contact"}</Button>
        </div>
      </Modal>
    </Page>
  )
}
