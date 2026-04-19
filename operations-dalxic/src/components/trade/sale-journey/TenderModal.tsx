"use client"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  EMERALD, EMERALD_L, EMERALD_GL, TRADE, TRADE_L, INK, INK_DIM, INK_FAINT,
  FONT_DISPLAY, FONT_BODY, FONT_MONO, glass, glassBright, input, label, btnPrimary, ghs,
} from "./tokens"
import type { TenderMethod, TenderResult } from "./types"

/* ═══════════════════════════════════════════════════════════════
   S3 — Tender slot
   Spine contract:
     Input:  { total: GHS }
     Output: TenderResult { method, amountTendered, change, reference?, customerPhone? }
     Failure: caller handles; modal surfaces provider errors
   Default (normaled): Cash + MoMo. Card + Credit surface when
   plug-ins stack (entitlement-gated).
   ═══════════════════════════════════════════════════════════════ */

const QUICK_CASH = [5, 10, 20, 50, 100, 200]

const METHODS: { key: TenderMethod; label: string; glyph: string; color: string; tint: string; tag: string }[] = [
  { key: "CASH", label: "Cash", glyph: "₵", color: EMERALD, tint: "rgba(16,185,129,0.10)", tag: "Instant" },
  { key: "MOBILE_MONEY", label: "Mobile Money", glyph: "M", color: "#8B5CF6", tint: "rgba(139,92,246,0.10)", tag: "MTN · Vodafone · AT" },
  { key: "CARD", label: "Card", glyph: "V", color: "#0EA5E9", tint: "rgba(14,165,233,0.10)", tag: "Visa · Mastercard" },
  { key: "CREDIT", label: "On Account", glyph: "A", color: TRADE, tint: "rgba(245,158,11,0.10)", tag: "Regulars Only" },
]

export function TenderModal({
  open,
  total,
  onConfirm,
  onCancel,
  processing = false,
  error = null,
  enabledMethods = ["CASH", "MOBILE_MONEY"],
}: {
  open: boolean
  total: number            // GHS
  onConfirm: (result: TenderResult) => void
  onCancel: () => void
  processing?: boolean
  error?: string | null
  enabledMethods?: TenderMethod[]
}) {
  const [method, setMethod] = useState<TenderMethod>("CASH")
  const [tendered, setTendered] = useState<string>("")
  const [phone, setPhone] = useState<string>("")
  const [reference, setReference] = useState<string>("")

  // MoMo real-time STK push + polling state
  const [momoStage, setMomoStage] = useState<"idle" | "pushing" | "otp" | "waiting" | "success" | "failed">("idle")
  const [momoDisplay, setMomoDisplay] = useState<string>("")
  const [momoRef, setMomoRef] = useState<string>("")
  const [otp, setOtp] = useState<string>("")
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollCountRef = useRef(0)

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    pollCountRef.current = 0
  }, [])

  useEffect(() => {
    if (open) {
      setMethod(enabledMethods[0] ?? "CASH")
      setTendered("")
      setPhone("")
      setReference("")
      setMomoStage("idle")
      setMomoDisplay("")
      setMomoRef("")
      setOtp("")
      stopPolling()
    }
    return stopPolling
  }, [open, enabledMethods, stopPolling])

  const tenderedNum = useMemo(() => {
    const n = parseFloat(tendered)
    return Number.isFinite(n) ? n : 0
  }, [tendered])

  const change = Math.max(0, tenderedNum - total)
  const shortfall = Math.max(0, total - tenderedNum)

  const canConfirm = useMemo(() => {
    if (processing) return false
    if (method === "CASH") return tenderedNum >= total
    if (method === "MOBILE_MONEY") return phone.replace(/\D/g, "").length >= 9 && (momoStage === "idle" || momoStage === "failed")
    if (method === "CARD") return reference.trim().length >= 4 || tenderedNum >= total
    if (method === "CREDIT") return phone.replace(/\D/g, "").length >= 9
    return false
  }, [method, tenderedNum, total, phone, reference, processing, momoStage])

  const handleMoMoCharge = async () => {
    if (phone.replace(/\D/g, "").length < 9) return
    const ref = `DALXIC-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setMomoStage("pushing")
    setMomoDisplay("Sending payment prompt to your phone...")
    setMomoRef(ref)
    try {
      const res = await fetch("/api/trade/payments/momo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(total * 100),
          phone: phone.trim(),
          reference: ref,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setMomoStage("failed")
        setMomoDisplay(data.error || data.displayText || "Payment request failed")
        return
      }
      setMomoRef(data.reference || ref)

      // Vodafone/Telecel requires OTP entry; MTN goes straight to polling
      if (data.status === "send_otp") {
        setMomoStage("otp")
        setMomoDisplay(data.displayText || "Enter the OTP sent to the customer's phone")
        setOtp("")
        return
      }

      startVerifyPolling(data.reference || ref, data.displayText || "Approve the prompt on your phone...")
    } catch {
      setMomoStage("failed")
      setMomoDisplay("Network error. Check your connection and try again.")
    }
  }

  const startVerifyPolling = (refToVerify: string, display: string) => {
    setMomoStage("waiting")
    setMomoDisplay(display)
    pollCountRef.current = 0
    pollRef.current = setInterval(async () => {
      pollCountRef.current++
      if (pollCountRef.current > 40) {
        stopPolling()
        setMomoStage("failed")
        setMomoDisplay("Payment timed out. Customer may not have approved. Try again.")
        return
      }
      try {
        const vRes = await fetch(`/api/trade/payments/verify?reference=${encodeURIComponent(refToVerify)}`)
        const vData = await vRes.json()
        if (vData.success && vData.status === "success") {
          stopPolling()
          setMomoStage("success")
          setMomoDisplay("Payment received!")
          onConfirm({
            method: "MOBILE_MONEY",
            amountTendered: total,
            change: 0,
            reference: refToVerify,
            customerPhone: phone.trim(),
          })
        } else if (vData.status === "failed" || vData.status === "abandoned") {
          stopPolling()
          setMomoStage("failed")
          setMomoDisplay("Payment was declined or cancelled. Try again.")
        }
      } catch { /* keep polling */ }
    }, 3000)
  }

  const handleOtpSubmit = async () => {
    if (otp.length < 4 || !momoRef) return
    setMomoStage("pushing")
    setMomoDisplay("Verifying OTP...")
    try {
      const res = await fetch("/api/trade/payments/submit-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp, reference: momoRef }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setMomoStage("otp")
        setMomoDisplay(data.displayText || data.error || "Invalid OTP. Try again.")
        setOtp("")
        return
      }
      if (data.status === "success") {
        setMomoStage("success")
        setMomoDisplay("Payment received!")
        onConfirm({
          method: "MOBILE_MONEY",
          amountTendered: total,
          change: 0,
          reference: momoRef,
          customerPhone: phone.trim(),
        })
      } else {
        startVerifyPolling(momoRef, data.displayText || "Payment processing...")
      }
    } catch {
      setMomoStage("otp")
      setMomoDisplay("Network error. Try submitting OTP again.")
    }
  }

  const handleConfirm = () => {
    if (!canConfirm) return
    if (method === "MOBILE_MONEY") {
      handleMoMoCharge()
      return
    }
    const result: TenderResult = {
      method,
      amountTendered: method === "CASH" ? tenderedNum : total,
      change: method === "CASH" ? change : 0,
      reference: reference.trim() || undefined,
      customerPhone: phone.trim() || undefined,
    }
    onConfirm(result)
  }

  if (!open) return null

  const active = METHODS.find(m => m.key === method)!

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(2,6,8,0.72)", backdropFilter: "blur(10px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: FONT_BODY, padding: 20,
        animation: "tenderFade 0.2s ease",
      }}
      onClick={onCancel}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          ...glassBright,
          width: "min(560px, 100%)", maxHeight: "92vh", overflowY: "auto",
          background: "linear-gradient(180deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))",
          border: `1px solid ${EMERALD}28`,
          boxShadow: `0 30px 80px rgba(0,0,0,0.55), 0 0 0 1px ${EMERALD}15 inset`,
          padding: "28px 28px 22px",
          animation: "tenderRise 0.28s cubic-bezier(0.2,0.9,0.3,1)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div>
            <div style={{ ...label, color: EMERALD, marginBottom: 6 }}>Tender</div>
            <div style={{ fontSize: 13, color: INK_DIM, fontFamily: FONT_BODY }}>How is the customer paying?</div>
          </div>
          <button
            onClick={onCancel}
            aria-label="Close"
            style={{
              width: 32, height: 32, borderRadius: 10,
              background: "rgba(255,255,255,0.04)", border: `1px solid ${EMERALD}15`,
              color: INK_DIM, cursor: "pointer", fontSize: 14, fontWeight: 700,
            }}
          >×</button>
        </div>

        {/* Total hero */}
        <div style={{
          padding: "24px 22px", borderRadius: 14, marginBottom: 22,
          background: `linear-gradient(135deg, rgba(245,158,11,0.14), rgba(16,185,129,0.04))`,
          border: `1px solid ${TRADE}25`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: INK_DIM, marginBottom: 6 }}>Amount Due</div>
            <div style={{ fontSize: 34, fontWeight: 800, color: TRADE_L, fontFamily: FONT_DISPLAY, letterSpacing: -1 }}>
              {ghs(total)}
            </div>
          </div>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: `linear-gradient(135deg, ${TRADE}, ${TRADE_L})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, fontWeight: 800, color: "#1a1408", fontFamily: FONT_DISPLAY,
            boxShadow: `0 10px 30px ${TRADE}40`,
          }}>₵</div>
        </div>

        {/* Method selector */}
        <div style={{ ...label, marginBottom: 10 }}>Method</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
          {METHODS.map(m => {
            const enabled = enabledMethods.includes(m.key)
            const selected = method === m.key
            return (
              <button
                key={m.key}
                onClick={() => enabled && setMethod(m.key)}
                disabled={!enabled}
                style={{
                  padding: "14px 14px",
                  borderRadius: 12,
                  border: selected ? `1px solid ${m.color}` : `1px solid ${EMERALD}12`,
                  background: selected ? m.tint : "rgba(255,255,255,0.02)",
                  boxShadow: selected ? `0 0 0 3px ${m.color}18, 0 8px 24px ${m.color}20` : "none",
                  cursor: enabled ? "pointer" : "not-allowed",
                  opacity: enabled ? 1 : 0.32,
                  display: "flex", alignItems: "center", gap: 12, textAlign: "left",
                  transition: "all 0.2s ease",
                  fontFamily: FONT_BODY,
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: `linear-gradient(135deg, ${m.color}, ${m.color}aa)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: FONT_DISPLAY,
                  flexShrink: 0,
                }}>{m.glyph}</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: selected ? INK : INK_DIM, marginBottom: 2 }}>{m.label}</div>
                  <div style={{ fontSize: 10, color: INK_FAINT, fontFamily: FONT_MONO, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.tag}</div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Method-specific panel */}
        <div style={{ marginBottom: 22 }}>
          {method === "CASH" && (
            <div>
              <div style={{ ...label, marginBottom: 8 }}>Amount Tendered</div>
              <input
                autoFocus
                type="number"
                inputMode="decimal"
                step="0.01"
                value={tendered}
                onChange={e => setTendered(e.target.value)}
                placeholder={total.toFixed(2)}
                style={{
                  ...input,
                  fontSize: 24, fontWeight: 800, fontFamily: FONT_DISPLAY, letterSpacing: -0.5,
                  padding: "16px 18px", background: "rgba(16,185,129,0.06)", color: INK,
                  borderColor: `${EMERALD}25`,
                }}
              />
              <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                {QUICK_CASH.filter(v => v >= total || v >= 5).map(v => (
                  <button
                    key={v}
                    onClick={() => setTendered(v.toString())}
                    style={{
                      padding: "8px 14px", borderRadius: 8,
                      fontSize: 11, fontWeight: 700, fontFamily: FONT_MONO,
                      background: "rgba(16,185,129,0.08)", color: EMERALD_L,
                      border: `1px solid ${EMERALD}15`, cursor: "pointer",
                    }}
                  >₵{v}</button>
                ))}
                <button
                  onClick={() => setTendered(total.toFixed(2))}
                  style={{
                    padding: "8px 14px", borderRadius: 8,
                    fontSize: 11, fontWeight: 700, fontFamily: FONT_MONO,
                    background: `${EMERALD}15`, color: EMERALD_GL,
                    border: `1px solid ${EMERALD}30`, cursor: "pointer",
                  }}
                >Exact</button>
              </div>
              {/* Change / shortfall */}
              <div style={{
                marginTop: 14, padding: "14px 16px", borderRadius: 12,
                background: shortfall > 0 ? "rgba(239,68,68,0.08)" : change > 0 ? `${EMERALD}10` : "rgba(255,255,255,0.02)",
                border: `1px solid ${shortfall > 0 ? "rgba(239,68,68,0.25)" : change > 0 ? EMERALD + "25" : "rgba(255,255,255,0.05)"}`,
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: INK_DIM }}>
                  {shortfall > 0 ? "Shortfall" : "Change Due"}
                </span>
                <span style={{
                  fontSize: 22, fontWeight: 800, fontFamily: FONT_DISPLAY, letterSpacing: -0.5,
                  color: shortfall > 0 ? "#EF4444" : change > 0 ? EMERALD_L : INK_FAINT,
                }}>
                  {ghs(shortfall > 0 ? shortfall : change)}
                </span>
              </div>
            </div>
          )}

          {method === "MOBILE_MONEY" && (
            <div>
              <div style={{ ...label, marginBottom: 8 }}>Customer Phone</div>
              <input
                autoFocus
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={e => { if (momoStage === "idle" || momoStage === "failed") setPhone(e.target.value.replace(/[^\d+\s]/g, "")) }}
                placeholder="024 000 0000"
                disabled={momoStage === "pushing" || momoStage === "waiting"}
                style={{
                  ...input,
                  fontSize: 22, fontWeight: 700, fontFamily: FONT_MONO, letterSpacing: 1,
                  padding: "16px 18px", background: "rgba(139,92,246,0.06)",
                  borderColor: "rgba(139,92,246,0.30)", color: INK,
                  opacity: momoStage === "pushing" || momoStage === "waiting" ? 0.6 : 1,
                }}
              />

              {/* MoMo real-time status */}
              {momoStage === "idle" && (
                <div style={{
                  marginTop: 14, padding: "12px 16px", borderRadius: 10,
                  background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.18)",
                  fontSize: 12, color: "#C4B5FD", fontFamily: FONT_BODY, lineHeight: 1.5,
                }}>
                  <strong style={{ color: "#DDD6FE" }}>How It Works.</strong>{" "}
                  Enter the customer&apos;s MTN, Vodafone, or AirtelTigo number.
                  They&apos;ll get a prompt on their phone to approve {ghs(total)}.
                </div>
              )}

              {momoStage === "pushing" && (
                <div style={{
                  marginTop: 14, padding: "16px 16px", borderRadius: 10,
                  background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.30)",
                  fontSize: 13, color: "#DDD6FE", fontFamily: FONT_BODY, textAlign: "center",
                  animation: "tenderFade 0.3s ease",
                }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>📲</div>
                  <strong>Sending Payment Prompt...</strong>
                </div>
              )}

              {momoStage === "otp" && (
                <div style={{
                  marginTop: 14, padding: "16px 16px", borderRadius: 10,
                  background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.30)",
                  fontSize: 13, color: "#DDD6FE", fontFamily: FONT_BODY,
                  animation: "tenderFade 0.3s ease",
                }}>
                  <div style={{ fontSize: 24, marginBottom: 8, textAlign: "center" }}>🔑</div>
                  <div style={{ textAlign: "center", marginBottom: 12 }}>
                    <strong>Enter OTP</strong>
                    <div style={{ fontSize: 11, color: "#C4B5FD", marginTop: 4 }}>{momoDisplay}</div>
                  </div>
                  <input
                    autoFocus
                    type="text"
                    inputMode="numeric"
                    maxLength={8}
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter OTP"
                    style={{
                      ...input,
                      fontSize: 28, fontWeight: 800, fontFamily: FONT_MONO, letterSpacing: 8,
                      padding: "14px 18px", background: "rgba(139,92,246,0.10)",
                      borderColor: "rgba(139,92,246,0.40)", color: INK,
                      textAlign: "center",
                    }}
                  />
                  <button
                    onClick={handleOtpSubmit}
                    disabled={otp.length < 4}
                    style={{
                      marginTop: 10, width: "100%", padding: "12px",
                      borderRadius: 10, fontSize: 13, fontWeight: 700,
                      fontFamily: FONT_BODY, letterSpacing: "0.06em", textTransform: "uppercase",
                      background: otp.length >= 4 ? "linear-gradient(135deg, #8B5CF6, #7C3AED)" : "rgba(255,255,255,0.04)",
                      color: otp.length >= 4 ? "#fff" : INK_FAINT,
                      border: "none", cursor: otp.length >= 4 ? "pointer" : "not-allowed",
                      boxShadow: otp.length >= 4 ? "0 8px 24px rgba(139,92,246,0.35)" : "none",
                    }}
                  >Submit OTP</button>
                </div>
              )}

              {momoStage === "waiting" && (
                <div style={{
                  marginTop: 14, padding: "16px 16px", borderRadius: 10,
                  background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.30)",
                  fontSize: 13, color: "#DDD6FE", fontFamily: FONT_BODY, textAlign: "center",
                  animation: "tenderFade 0.3s ease",
                }}>
                  <div style={{ fontSize: 28, marginBottom: 8, animation: "pulse 1.5s infinite" }}>📱</div>
                  <strong>Waiting For Customer To Approve</strong>
                  <div style={{ fontSize: 11, color: "#C4B5FD", marginTop: 6 }}>{momoDisplay}</div>
                  <div style={{
                    marginTop: 10, height: 3, borderRadius: 2, background: "rgba(139,92,246,0.20)", overflow: "hidden",
                  }}>
                    <div style={{
                      height: "100%", borderRadius: 2, background: "#8B5CF6",
                      animation: "momoProgress 2s ease-in-out infinite",
                    }} />
                  </div>
                </div>
              )}

              {momoStage === "failed" && (
                <div style={{
                  marginTop: 14, padding: "14px 16px", borderRadius: 10,
                  background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.28)",
                  fontSize: 12, color: "#FCA5A5", fontFamily: FONT_BODY, lineHeight: 1.5,
                }}>
                  <strong style={{ color: "#FECACA" }}>Payment Failed.</strong>{" "}
                  {momoDisplay}
                  <div style={{ marginTop: 8 }}>
                    <button
                      onClick={() => { setMomoStage("idle"); setMomoDisplay(""); setOtp("") }}
                      style={{
                        padding: "6px 14px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                        background: "rgba(239,68,68,0.15)", color: "#FCA5A5",
                        border: "1px solid rgba(239,68,68,0.30)", cursor: "pointer",
                      }}
                    >Try Again</button>
                  </div>
                </div>
              )}

              {momoStage === "success" && (
                <div style={{
                  marginTop: 14, padding: "14px 16px", borderRadius: 10,
                  background: `${EMERALD}12`, border: `1px solid ${EMERALD}30`,
                  fontSize: 13, color: EMERALD_GL, fontFamily: FONT_BODY, textAlign: "center",
                  animation: "tenderFade 0.3s ease",
                }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>✓</div>
                  <strong>Payment Received!</strong>
                </div>
              )}
            </div>
          )}

          {method === "CARD" && (
            <div>
              <div style={{ ...label, marginBottom: 8 }}>Terminal Reference</div>
              <input
                autoFocus
                value={reference}
                onChange={e => setReference(e.target.value)}
                placeholder="Auth code from terminal"
                style={{ ...input, fontFamily: FONT_MONO, fontSize: 14, padding: "14px 18px" }}
              />
              <div style={{
                marginTop: 14, padding: "12px 16px", borderRadius: 10,
                background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.18)",
                fontSize: 12, color: "#93C5FD", fontFamily: FONT_BODY, lineHeight: 1.5,
              }}>
                <strong style={{ color: "#BFDBFE" }}>Tap · Insert · Swipe.</strong>{" "}
                Complete the transaction on the terminal, then enter the auth code here.
              </div>
            </div>
          )}

          {method === "CREDIT" && (
            <div>
              <div style={{ ...label, marginBottom: 8 }}>Customer Phone</div>
              <input
                autoFocus
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/[^\d+\s]/g, ""))}
                placeholder="024 000 0000"
                style={{ ...input, fontFamily: FONT_MONO, fontSize: 14, padding: "14px 18px" }}
              />
              <div style={{
                marginTop: 14, padding: "12px 16px", borderRadius: 10,
                background: `${TRADE}10`, border: `1px solid ${TRADE}28`,
                fontSize: 12, color: TRADE_L, fontFamily: FONT_BODY, lineHeight: 1.5,
              }}>
                <strong>Posting to account.</strong>{" "}
                {ghs(total)} will be added to this customer&apos;s balance.
                They&apos;ll see it on their next statement.
              </div>
            </div>
          )}
        </div>

        {error && (
          <div style={{
            padding: "16px 18px", borderRadius: 12, marginBottom: 16,
            background: "rgba(239,68,68,0.15)", border: "2px solid rgba(239,68,68,0.50)",
            color: "#FCA5A5", fontSize: 14, fontWeight: 700, lineHeight: 1.5,
            animation: "tenderFade 0.2s ease",
          }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#EF4444", marginBottom: 6 }}>Sale Error</div>
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: "0 0 auto", padding: "14px 22px", borderRadius: 12,
              fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
              color: INK_DIM, background: "rgba(255,255,255,0.03)",
              border: `1px solid ${EMERALD}15`, cursor: "pointer", fontFamily: FONT_BODY,
            }}
          >Back</button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm || processing || momoStage === "pushing" || momoStage === "waiting" || momoStage === "otp"}
            style={{
              ...btnPrimary,
              flex: 1, padding: "14px 22px", fontSize: 13,
              background: processing
                ? "rgba(245,158,11,0.25)"
                : (canConfirm && momoStage !== "pushing" && momoStage !== "waiting" && momoStage !== "otp")
                  ? `linear-gradient(135deg, ${active.color}, ${active.color}cc)`
                  : "rgba(255,255,255,0.04)",
              boxShadow: (canConfirm && !processing && momoStage !== "pushing" && momoStage !== "waiting" && momoStage !== "otp") ? `0 10px 32px ${active.color}35` : "none",
              color: processing ? TRADE_L : canConfirm ? "#fff" : INK_FAINT,
              opacity: (canConfirm || processing) ? 1 : 0.55,
              cursor: (canConfirm && !processing) ? "pointer" : "not-allowed",
            }}
          >
            {processing ? "Processing Sale…" : momoStage === "pushing" ? "Sending Prompt…" : momoStage === "waiting" ? "Waiting For Approval…" : `Confirm ${active.label}`}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes tenderFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes tenderRise { from { opacity: 0; transform: translateY(16px) scale(0.98); } to { opacity: 1; transform: none; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes momoProgress { 0% { width: 5%; } 50% { width: 75%; } 100% { width: 5%; } }
      `}</style>
    </div>
  )
}
