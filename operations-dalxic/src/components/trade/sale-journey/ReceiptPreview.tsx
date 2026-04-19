"use client"
import { useEffect, useRef, useState } from "react"
import {
  EMERALD, EMERALD_L, EMERALD_GL, TRADE, TRADE_L, INK, INK_DIM, INK_FAINT,
  FONT_DISPLAY, FONT_BODY, FONT_MONO, glassBright, input, ghs,
} from "./tokens"
import type { CompletedSale } from "./types"

/* ═══════════════════════════════════════════════════════════════
   S16 — Receipt template slot + S17 delivery options slot
   Spine contract:
     Input:  CompletedSale
     Output: caller dismiss OR delivery channel fired
     Failure: delivery channel may fail; surface inline, don't
              block "New Sale" — the sale is already posted.
   Default (normaled): retail receipt. Print + WhatsApp exposed.
   ═══════════════════════════════════════════════════════════════ */

const methodLabel = (m: string): string => ({
  CASH: "Cash",
  MOBILE_MONEY: "Mobile Money",
  CARD: "Card",
  CREDIT: "On Account",
} as Record<string, string>)[m] ?? m

const methodTint = (m: string): string => ({
  CASH: EMERALD,
  MOBILE_MONEY: "#8B5CF6",
  CARD: "#0EA5E9",
  CREDIT: TRADE,
} as Record<string, string>)[m] ?? EMERALD

export function ReceiptPreview({
  sale,
  open,
  onNewSale,
  onDismiss,
  onWhatsApp,
  onPrint,
}: {
  sale: CompletedSale | null
  open: boolean
  onNewSale: () => void
  onDismiss: () => void
  onWhatsApp?: (phone: string) => Promise<void> | void
  onPrint?: () => void
}) {
  const [phone, setPhone] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState<string | null>(null)
  const [printed, setPrinted] = useState(false)
  const receiptRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && sale) {
      setPhone(sale.customerPhone ?? "")
      setSent(null)
      setPrinted(false)
    }
  }, [open, sale])

  if (!open || !sale) return null

  const handleWhatsApp = async () => {
    const p = phone.replace(/\D/g, "")
    if (p.length < 9 || sending) return
    setSending(true)
    try {
      if (onWhatsApp) await onWhatsApp(phone)
      setSent(`Sent to ${phone}`)
    } catch (err) {
      setSent(err instanceof Error ? `Error: ${err.message}` : "Send failed")
    } finally {
      setSending(false)
      setTimeout(() => setSent(null), 3500)
    }
  }

  const handlePrint = () => {
    if (onPrint) onPrint()
    else if (typeof window !== "undefined") window.print()
    setPrinted(true)
    setTimeout(() => setPrinted(false), 2500)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(2,6,8,0.75)", backdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: FONT_BODY, padding: 20,
        animation: "receiptFade 0.22s ease",
      }}
      onClick={onDismiss}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "min(960px, 100%)", maxHeight: "94vh", overflowY: "auto",
          display: "grid", gridTemplateColumns: "minmax(300px, 360px) 1fr", gap: 18,
          animation: "receiptRise 0.32s cubic-bezier(0.2,0.9,0.3,1)",
        }}
        className="receipt-dialog"
      >
        {/* Paper receipt */}
        <div
          ref={receiptRef}
          style={{
            background: "linear-gradient(180deg, #FAFAFA 0%, #F3F4F6 100%)",
            color: "#1a1a1a",
            borderRadius: 10,
            padding: "28px 26px 32px",
            fontFamily: FONT_MONO,
            fontSize: 12,
            lineHeight: 1.6,
            boxShadow: "0 30px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Tear edge */}
          <div style={{
            position: "absolute", top: -1, left: 0, right: 0, height: 10,
            background: "repeating-linear-gradient(45deg, transparent 0 6px, #040A0F 6px 12px)",
            maskImage: "linear-gradient(180deg, #000 0, #000 60%, transparent 100%)",
          }} />

          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 800, letterSpacing: "0.04em", color: "#0a0a0a" }}>
              {sale.orgName.toUpperCase()}
            </div>
            <div style={{ fontSize: 10, color: "#4a4a4a", marginTop: 4, letterSpacing: "0.08em" }}>
              POWERED BY DALXIC OPERATIONS
            </div>
          </div>

          <div style={{
            display: "flex", justifyContent: "space-between",
            padding: "10px 0", borderTop: "1px dashed #9a9a9a", borderBottom: "1px dashed #9a9a9a",
            fontSize: 11, color: "#2a2a2a",
          }}>
            <div>
              <div style={{ color: "#6a6a6a", fontSize: 9, letterSpacing: "0.08em" }}>RECEIPT</div>
              <div style={{ fontWeight: 700 }}>{sale.receiptCode}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "#6a6a6a", fontSize: 9, letterSpacing: "0.08em" }}>DATE</div>
              <div style={{ fontWeight: 700 }}>{new Date(sale.timestamp).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}</div>
            </div>
          </div>

          <div style={{ padding: "14px 0" }}>
            {sale.items.map((it, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: "#0a0a0a" }}>{it.name}</div>
                  <div style={{ fontSize: 10, color: "#6a6a6a" }}>{it.qty} × {ghs(it.price)}</div>
                </div>
                <div style={{ fontWeight: 700, color: "#0a0a0a", whiteSpace: "nowrap", marginLeft: 12 }}>
                  {ghs(it.qty * it.price)}
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px dashed #9a9a9a", paddingTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800, color: "#0a0a0a", fontFamily: FONT_DISPLAY }}>
              <span>TOTAL</span>
              <span>{ghs(sale.total)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 11 }}>
              <span style={{ color: "#4a4a4a" }}>Paid · {methodLabel(sale.method)}</span>
              <span style={{ fontWeight: 700, color: "#0a0a0a" }}>{ghs(sale.total + (sale.change ?? 0))}</span>
            </div>
            {sale.change !== undefined && sale.change > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2, fontSize: 11 }}>
                <span style={{ color: "#4a4a4a" }}>Change</span>
                <span style={{ fontWeight: 700, color: "#0a0a0a" }}>{ghs(sale.change)}</span>
              </div>
            )}
          </div>

          <div style={{ marginTop: 20, textAlign: "center", fontSize: 10, color: "#6a6a6a", letterSpacing: "0.06em" }}>
            THANK YOU · COME AGAIN
          </div>
          <div style={{ marginTop: 8, textAlign: "center", fontSize: 9, color: "#8a8a8a" }}>
            Served by {sale.cashier}
          </div>
        </div>

        {/* Actions panel */}
        <div style={{
          ...glassBright,
          padding: "24px 24px 22px",
          display: "flex", flexDirection: "column",
          background: "linear-gradient(180deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))",
          border: `1px solid ${EMERALD}25`,
          boxShadow: `0 30px 80px rgba(0,0,0,0.45)`,
        }}>
          {/* Success header */}
          <div style={{ marginBottom: 20 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: `linear-gradient(135deg, ${EMERALD}, ${EMERALD_L})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24, color: "#fff", fontFamily: FONT_DISPLAY, fontWeight: 800,
              boxShadow: `0 10px 30px ${EMERALD}45`, marginBottom: 14,
            }}>✓</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: INK, fontFamily: FONT_DISPLAY, letterSpacing: -0.5, marginBottom: 4 }}>
              Sale Complete
            </div>
            <div style={{ fontSize: 13, color: INK_DIM, fontFamily: FONT_BODY }}>
              Receipt{" "}
              <span style={{ color: EMERALD_L, fontFamily: FONT_MONO, fontWeight: 700 }}>{sale.receiptCode}</span>
              {" "}· {ghs(sale.total)} · {methodLabel(sale.method)}
            </div>
            {sale.change !== undefined && sale.change > 0 && (
              <div style={{
                marginTop: 12, padding: "10px 14px", borderRadius: 10,
                background: `${TRADE}12`, border: `1px solid ${TRADE}28`,
                fontSize: 12, color: TRADE_L, fontFamily: FONT_BODY,
              }}>
                Hand back <strong>{ghs(sale.change)}</strong> in change.
              </div>
            )}
          </div>

          {/* Delivery */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: INK_FAINT, marginBottom: 10 }}>
              Send Receipt
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input
                type="tel"
                placeholder="WhatsApp number"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/[^\d+\s]/g, ""))}
                style={{
                  ...input,
                  flex: 1, fontFamily: FONT_MONO, fontSize: 13, padding: "11px 14px",
                  background: "rgba(37,211,102,0.06)", borderColor: "rgba(37,211,102,0.25)",
                }}
              />
              <button
                onClick={handleWhatsApp}
                disabled={phone.replace(/\D/g, "").length < 9 || sending}
                style={{
                  padding: "0 18px", borderRadius: 10,
                  fontSize: 12, fontWeight: 700, letterSpacing: "0.04em",
                  color: "#fff", background: "linear-gradient(135deg, #25D366, #128C7E)",
                  border: "none", cursor: "pointer", fontFamily: FONT_BODY,
                  boxShadow: "0 6px 20px rgba(37,211,102,0.30)",
                  opacity: phone.replace(/\D/g, "").length < 9 || sending ? 0.4 : 1,
                  whiteSpace: "nowrap",
                }}
              >{sending ? "Sending…" : "WhatsApp"}</button>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handlePrint}
                style={{
                  flex: 1, padding: "12px", borderRadius: 10,
                  fontSize: 12, fontWeight: 700, letterSpacing: "0.04em",
                  color: INK, background: printed ? `${EMERALD}15` : "rgba(255,255,255,0.04)",
                  border: `1px solid ${printed ? EMERALD + "35" : EMERALD + "15"}`,
                  cursor: "pointer", fontFamily: FONT_BODY,
                  transition: "all 0.2s",
                }}
              >{printed ? "Printed ✓" : "Print Receipt"}</button>
              <button
                onClick={onDismiss}
                style={{
                  flex: 1, padding: "12px", borderRadius: 10,
                  fontSize: 12, fontWeight: 700, letterSpacing: "0.04em",
                  color: INK_DIM, background: "rgba(255,255,255,0.03)",
                  border: `1px solid ${EMERALD}12`, cursor: "pointer", fontFamily: FONT_BODY,
                }}
              >Just Close</button>
            </div>

            {sent && (
              <div style={{
                marginTop: 10, padding: "8px 12px", borderRadius: 8,
                background: sent.startsWith("Error") ? "rgba(239,68,68,0.10)" : `${EMERALD}10`,
                border: `1px solid ${sent.startsWith("Error") ? "rgba(239,68,68,0.25)" : EMERALD + "25"}`,
                fontSize: 11, fontWeight: 600,
                color: sent.startsWith("Error") ? "#FCA5A5" : EMERALD_GL,
              }}>{sent}</div>
            )}
          </div>

          {/* Primary action */}
          <div style={{ marginTop: "auto" }}>
            <button
              onClick={onNewSale}
              autoFocus
              style={{
                width: "100%", padding: "16px 22px", borderRadius: 12,
                fontSize: 13, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase",
                color: "#041406",
                background: `linear-gradient(135deg, ${EMERALD_L}, ${EMERALD_GL})`,
                border: "none", cursor: "pointer", fontFamily: FONT_DISPLAY,
                boxShadow: `0 12px 36px ${EMERALD}40`,
              }}
            >Next Sale →</button>
            <div style={{
              marginTop: 10, textAlign: "center",
              fontSize: 10, color: INK_FAINT, fontFamily: FONT_MONO, letterSpacing: "0.06em",
            }}>Press Enter to continue</div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes receiptFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes receiptRise { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
        @media (max-width: 720px) {
          .receipt-dialog { grid-template-columns: 1fr !important; }
        }
        @media print {
          body > *:not(.receipt-print) { display: none !important; }
        }
      `}</style>
    </div>
  )
}
