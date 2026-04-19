"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import { HealthShell } from "@/components/ops/HealthShell"
import { useAuth } from "@/lib/use-auth"
import { Page, Card, Stat, Pill, T, Empty } from "@/components/ops/primitives"

interface QueueEntry {
  id: string; token: string; contactId: string; department: string
  chiefComplaint: string; symptomSeverity: number; emergencyFlag: boolean
  visitStatus: string; priority: number; queuedAt: string
  assignedDoctorId?: string | null
  contact?: { id: string; name: string } | null
}

export default function WaitingRoomPage() {
  const { session, authFetch } = useAuth()
  const [queue, setQueue] = useState<QueueEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchQueue = useCallback(async () => {
    if (!session) return
    try {
      const res = await authFetch("/api/health/queue")
      const json = await res.json()
      if (json.success) setQueue(json.data)
    } catch { /* silent */ } finally { setLoading(false) }
  }, [session, authFetch])

  useEffect(() => { if (session) fetchQueue() }, [session, fetchQueue])

  useEffect(() => {
    if (!session) return
    const interval = setInterval(fetchQueue, 30000)
    return () => clearInterval(interval)
  }, [session, fetchQueue])

  const waiting = useMemo(() => queue.filter(q => q.visitStatus === "waiting").sort((a, b) => b.symptomSeverity - a.symptomSeverity), [queue])
  const beingSeen = queue.filter(q => q.visitStatus === "in_consultation")
  const emergActive = queue.filter(q => q.emergencyFlag && q.visitStatus !== "closed")
  const avgWait = waiting.length > 0 ? Math.round(waiting.reduce((s, q) => s + Math.round((Date.now() - new Date(q.queuedAt).getTime()) / 60000), 0) / waiting.length) : 0
  const labWaiting = queue.filter(q => q.visitStatus === "paused_for_lab")

  const nowServing = beingSeen[0]
  const upNext = waiting.slice(0, 3)
  const rest = waiting.slice(3)

  const estimateWait = (position: number) => {
    const avgConsultMins = 15
    return position * avgConsultMins
  }

  return (
    <HealthShell>
      <Page accent="copper" title="Waiting Room" subtitle="Live Queue Display Board — Now Serving, Up Next And Full Queue.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          <Stat label="Total Waiting" value={waiting.length} accent="copper" icon="orders" />
          <Stat label="Being Seen" value={beingSeen.length} accent="emerald" icon="user" />
          <Stat label="Emergency Active" value={emergActive.length} accent="neutral" icon="bolt" />
          <Stat label="Avg Wait Time" value={`${avgWait}m`} accent="amber" icon="calendar" />
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 48, color: T.txD, fontSize: 13, fontWeight: 600 }}>Loading Queue…</div>
        ) : (
          <>
            {nowServing && (
              <Card padding={32} style={{ marginBottom: 20, textAlign: "center", background: `${T.copper}08`, border: `1px solid ${T.copper}30` }}>
                <div style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 700, color: T.copper, marginBottom: 12, fontFamily: "'DM Mono', monospace" }}>Now Serving</div>
                <div style={{ fontSize: 56, fontWeight: 800, color: T.copper, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.03em", lineHeight: 1 }}>{nowServing.token}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: T.tx, fontFamily: "'Space Grotesk', sans-serif", marginTop: 12 }}>{nowServing.contact?.name || "Patient"}</div>
                <div style={{ fontSize: 13, color: T.txM, marginTop: 6 }}>{nowServing.department}</div>
              </Card>
            )}

            {upNext.length > 0 && (
              <>
                <div style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 700, color: T.txD, marginBottom: 10, fontFamily: "'DM Mono', monospace" }}>Up Next</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28 }}>
                  {upNext.map((q, idx) => (
                    <Card key={q.id} padding={20} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 32, fontWeight: 800, color: q.emergencyFlag ? T.red : T.copper, fontFamily: "'Space Grotesk', sans-serif" }}>{q.token}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.tx, marginTop: 6 }}>{q.contact?.name || "Patient"}</div>
                      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 8 }}>
                        <Pill tone={q.emergencyFlag ? "red" : q.symptomSeverity >= 4 ? "amber" : "emerald"}>{q.symptomSeverity}/10</Pill>
                        <span style={{ fontSize: 11, color: T.txD, fontFamily: "'DM Mono', monospace" }}>~{estimateWait(idx + 1)}m</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {labWaiting.length > 0 && (
              <>
                <div style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 700, color: T.sky, marginBottom: 10, fontFamily: "'DM Mono', monospace" }}>Waiting For Lab Results</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
                  {labWaiting.map(q => (
                    <Card key={q.id} padding={16} style={{ textAlign: "center", background: `${T.sky}08`, border: `1px solid ${T.sky}20` }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: T.sky, fontFamily: "'Space Grotesk', sans-serif" }}>{q.token}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.tx, marginTop: 4 }}>{q.contact?.name || "Patient"}</div>
                      <Pill tone="sky">Lab Pending</Pill>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {rest.length > 0 && (
              <>
                <div style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 700, color: T.txD, marginBottom: 10, fontFamily: "'DM Mono', monospace" }}>Full Queue</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
                  {rest.map((q, idx) => (
                    <Card key={q.id} padding={16} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: q.emergencyFlag ? T.red : T.txM, fontFamily: "'Space Grotesk', sans-serif" }}>{q.token}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.tx, marginTop: 4 }}>{q.contact?.name || "Patient"}</div>
                      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 6 }}>
                        <Pill tone={q.emergencyFlag ? "red" : q.symptomSeverity >= 4 ? "amber" : "emerald"}>{q.symptomSeverity}/10</Pill>
                        <span style={{ fontSize: 10, color: T.txD, fontFamily: "'DM Mono', monospace" }}>~{estimateWait(idx + 4)}m</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {waiting.length === 0 && !nowServing && (
              <Empty icon="check" title="No Patients Waiting" sub="The queue is empty. Patients will appear here when registered at the front desk." />
            )}
          </>
        )}
      </Page>
    </HealthShell>
  )
}
