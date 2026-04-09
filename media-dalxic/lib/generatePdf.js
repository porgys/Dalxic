/* ═══════════════════════════════════════════════════════════════════════════
   FORENSIC PDF GENERATOR — Premium Infographic-Style Export
   Uses jsPDF + jsPDF-AutoTable. Keynote aesthetic on paper.
   ═══════════════════════════════════════════════════════════════════════════ */
import jsPDF from "jspdf"
import "jspdf-autotable"

/* ── Brand palette ── */
const BG       = [6, 10, 20]
const CARD     = [12, 18, 37]
const VIOLET   = [129, 140, 248]
const GLOW     = [167, 139, 250]
const RED      = [239, 68, 68]
const GREEN    = [16, 185, 129]
const AMBER    = [245, 158, 11]
const CYAN     = [34, 211, 238]
const WHITE    = [236, 240, 255]
const MUTED    = [123, 141, 181]
const DIM      = [74, 90, 128]

const vCol = (v) => v === "AI_DETECTED" ? RED : v === "NEEDS_REVIEW" ? AMBER : GREEN
const dimCol = (v) => v > 65 ? RED : v > 45 ? AMBER : GREEN

/* ── Draw a filled rounded rect ── */
function roundRect(doc, x, y, w, h, r, color) {
  doc.setFillColor(...color)
  doc.roundedRect(x, y, w, h, r, r, "F")
}

/* ── Draw a donut/arc gauge ── */
function drawArc(doc, cx, cy, radius, value, color, bgColor = [30, 42, 74]) {
  const startAngle = -Math.PI / 2
  const segments = 60

  /* Background circle */
  doc.setDrawColor(...bgColor)
  doc.setLineWidth(3)
  for (let i = 0; i < segments; i++) {
    const a1 = startAngle + (i / segments) * 2 * Math.PI
    const a2 = startAngle + ((i + 1) / segments) * 2 * Math.PI
    doc.line(
      cx + Math.cos(a1) * radius, cy + Math.sin(a1) * radius,
      cx + Math.cos(a2) * radius, cy + Math.sin(a2) * radius,
    )
  }

  /* Value arc */
  const endSegment = Math.round((value / 100) * segments)
  doc.setDrawColor(...color)
  doc.setLineWidth(3.5)
  for (let i = 0; i < endSegment; i++) {
    const a1 = startAngle + (i / segments) * 2 * Math.PI
    const a2 = startAngle + ((i + 1) / segments) * 2 * Math.PI
    doc.line(
      cx + Math.cos(a1) * radius, cy + Math.sin(a1) * radius,
      cx + Math.cos(a2) * radius, cy + Math.sin(a2) * radius,
    )
  }
}

/* ── Draw a horizontal bar ── */
function drawBar(doc, x, y, maxW, value, color, h = 4) {
  roundRect(doc, x, y, maxW, h, 2, [30, 42, 74])
  if (value > 0) {
    roundRect(doc, x, y, maxW * (value / 100), h, 2, color)
  }
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PDF GENERATION
   ═══════════════════════════════════════════════════════════════ */
export function generateForensicPdf(report) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const W = 210, H = 297
  const M = 16 // margin
  const CW = W - M * 2 // content width
  let y = 0

  const col = vCol(report.verdict)
  const zone = report.verdict === "AI_DETECTED" ? "ai" : report.verdict === "NEEDS_REVIEW" ? "review" : "authentic"
  const sortedDims = [...(report.dimensions || [])].sort((a, b) => b.value - a.value)
  const avgDim = sortedDims.length > 0 ? Math.round(sortedDims.reduce((a, d) => a + d.value, 0) / sortedDims.length) : 0
  const threatLevel = report.confidence >= 90 ? "CRITICAL" : report.confidence >= 75 ? "HIGH" : report.confidence >= 50 ? "MODERATE" : "LOW"

  /* ──────────────────────────────────────────
     PAGE 1 — COVER / VERDICT
     ────────────────────────────────────────── */

  /* Full-page dark background */
  doc.setFillColor(...BG)
  doc.rect(0, 0, W, H, "F")

  /* Top accent strip */
  doc.setFillColor(...col)
  doc.rect(0, 0, W, 3, "F")

  /* Header bar */
  y = 14
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.setTextColor(...VIOLET)
  doc.text("DALXICFORENSICS", M, y)
  doc.setTextColor(...DIM)
  doc.setFont("helvetica", "normal")
  doc.text("ForensIQ\u2122 Certified Analysis Report", W - M, y, { align: "right" })

  /* Divider */
  y += 4
  doc.setDrawColor(...[30, 42, 74])
  doc.setLineWidth(0.3)
  doc.line(M, y, W - M, y)

  /* Case metadata strip */
  y += 12
  roundRect(doc, M, y, CW, 22, 4, CARD)

  const metaItems = [
    ["CASE ID", report.id || "N/A"],
    ["DATE", report.date || "N/A"],
    ["MEDIA TYPE", report.type || "N/A"],
    ["MODULE", (report.module || "ChromaVeil") + "\u2122"],
    ["ENGINE", "Nexus-7"],
  ]
  const metaSpacing = CW / metaItems.length
  metaItems.forEach(([label, value], i) => {
    const mx = M + i * metaSpacing + metaSpacing / 2
    doc.setFont("helvetica", "normal")
    doc.setFontSize(6)
    doc.setTextColor(...DIM)
    doc.text(label, mx, y + 8, { align: "center" })
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.setTextColor(...MUTED)
    doc.text(value, mx, y + 15, { align: "center" })
  })

  /* Main verdict section */
  y += 34
  roundRect(doc, M, y, CW, 72, 6, CARD)

  /* Accent bar on card */
  doc.setFillColor(...col)
  doc.rect(M, y, CW, 2.5, "F")

  /* Verdict text */
  const verdictLabel = zone === "ai" ? "AI DETECTED" : zone === "review" ? "HUMAN VERIFICATION NEEDED" : "AUTHENTIC CONTENT VERIFIED"
  doc.setFont("helvetica", "bold")
  doc.setFontSize(28)
  doc.setTextColor(...col)
  doc.text(verdictLabel, M + 20, y + 30)

  /* Confidence subtitle */
  const confText = zone === "ai"
    ? report.confidence + "% AI Generation Probability"
    : zone === "review"
      ? report.confidence + "% — Mixed Signals, Human Inspection Recommended"
      : report.confidence + "% Authenticity Confidence"
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(...MUTED)
  doc.text(confText, M + 20, y + 40)

  /* Title tag */
  doc.setFontSize(8)
  doc.setTextColor(...DIM)
  doc.text(report.title || "Untitled Analysis", M + 20, y + 52)

  /* Confidence arc gauge — right side of verdict card */
  const arcCX = W - M - 30
  const arcCY = y + 36
  drawArc(doc, arcCX, arcCY, 18, report.confidence, col)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.setTextColor(...col)
  doc.text(report.confidence + "%", arcCX, arcCY + 2, { align: "center" })
  doc.setFontSize(6)
  doc.setTextColor(...DIM)
  doc.text(zone === "ai" ? "AI PROB" : zone === "review" ? "REVIEW" : "AUTHENTIC", arcCX, arcCY + 8, { align: "center" })

  /* ── Threat Classification Strip ── */
  y += 84
  const stripItems = [
    { label: "THREAT LEVEL", value: threatLevel, color: col },
    { label: "OVERALL SCORE", value: (report.overall || avgDim) + "%", color: dimCol(report.overall || avgDim) },
    { label: "FLAGGED", value: sortedDims.filter(d => d.value > 65).length + "/" + sortedDims.length, color: VIOLET },
    { label: "ENGINE", value: "NEXUS-7", color: MUTED },
  ]
  const stripW = CW / stripItems.length
  stripItems.forEach((s, i) => {
    const sx = M + i * stripW
    roundRect(doc, sx + 1, y, stripW - 2, 28, 4, CARD)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(14)
    doc.setTextColor(...s.color)
    doc.text(s.value, sx + stripW / 2, y + 13, { align: "center" })
    doc.setFont("helvetica", "normal")
    doc.setFontSize(6)
    doc.setTextColor(...DIM)
    doc.text(s.label, sx + stripW / 2, y + 21, { align: "center" })
  })

  /* ── Forensic Dimensions Section ── */
  y += 40
  doc.setFont("helvetica", "bold")
  doc.setFontSize(7)
  doc.setTextColor(...VIOLET)
  doc.text("\u25C6  FORENSIC DIMENSION ANALYSIS", M, y)
  y += 3
  doc.setDrawColor(...VIOLET)
  doc.setLineWidth(0.3)
  doc.line(M, y, M + 60, y)

  y += 8
  if (sortedDims.length > 0) {
    const dimCardH = 14
    const colW = (CW - 8) / 2

    sortedDims.forEach((d, i) => {
      const isLeft = i % 2 === 0
      const dx = isLeft ? M : M + colW + 8
      const dy = y + Math.floor(i / 2) * (dimCardH + 6)

      /* Check page overflow */
      if (dy + dimCardH > H - 30) return

      roundRect(doc, dx, dy, colW, dimCardH, 3, CARD)

      /* Dimension name */
      doc.setFont("helvetica", "normal")
      doc.setFontSize(7)
      doc.setTextColor(...WHITE)
      doc.text(d.dimension, dx + 4, dy + 5.5)

      /* Bar */
      const barX = dx + 4
      const barY = dy + 8.5
      const barW = colW - 28
      drawBar(doc, barX, barY, barW, d.value, dimCol(d.value), 3)

      /* Score */
      doc.setFont("helvetica", "bold")
      doc.setFontSize(8)
      doc.setTextColor(...dimCol(d.value))
      doc.text(d.value + "%", dx + colW - 6, dy + 9.5, { align: "right" })
    })

    y += Math.ceil(sortedDims.length / 2) * (dimCardH + 6) + 4

    /* Composite score bar */
    if (y < H - 50) {
      roundRect(doc, M, y, CW, 14, 3, CARD)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(7)
      doc.setTextColor(...DIM)
      doc.text("COMPOSITE SCORE", M + 6, y + 9)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(14)
      doc.setTextColor(...dimCol(report.overall || avgDim))
      doc.text((report.overall || avgDim) + "%", W - M - 6, y + 10, { align: "right" })
      y += 20
    }
  }

  /* ── Forensic Assessment ── */
  if (report.reasoning && y < H - 60) {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(7)
    doc.setTextColor(...col)
    doc.text("\u25C6  FORENSIC ASSESSMENT", M, y)
    y += 3
    doc.setDrawColor(...col)
    doc.setLineWidth(0.3)
    doc.line(M, y, M + 50, y)
    y += 8

    roundRect(doc, M, y, CW, 34, 4, CARD)
    doc.setFillColor(...col)
    doc.rect(M, y, CW, 2, "F")

    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(...WHITE)
    const lines = doc.splitTextToSize(report.reasoning, CW - 16)
    doc.text(lines.slice(0, 5), M + 8, y + 12)
    y += 40
  }

  /* ── Footer ── */
  const footerY = H - 18
  doc.setDrawColor(...[30, 42, 74])
  doc.setLineWidth(0.3)
  doc.line(M, footerY, W - M, footerY)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.setTextColor(...VIOLET)
  doc.text("DalxicForensics", M, footerY + 7)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(6)
  doc.setTextColor(...DIM)
  doc.text("ForensIQ\u2122 Certified Analysis Report  \u00B7  Powered By Nexus-7 Engine", M, footerY + 12)

  doc.setTextColor(...DIM)
  doc.text("forensics.dalxic.com", W - M, footerY + 7, { align: "right" })
  doc.text("Page 1 of 1", W - M, footerY + 12, { align: "right" })

  /* ── Save ── */
  const filename = `DalxicForensics-${report.id || "report"}-${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(filename)
  return filename
}
