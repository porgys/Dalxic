import { db } from "@/lib/db";
import PDFDocument from "pdfkit";
import { rateLimit } from "@/lib/rate-limit";

// ═══════════════════════════════════════════════════════════════
//  PUBLIC API
// ═══════════════════════════════════════════════════════════════

export async function GET(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "patient";

  if (type === "patient") {
    const recordId = searchParams.get("recordId");
    if (!recordId) return Response.json({ error: "recordId required" }, { status: 400 });
    return generatePatientPDF(recordId);
  }

  if (type === "monthly") {
    const bookId = searchParams.get("bookId");
    if (!bookId) return Response.json({ error: "bookId required" }, { status: 400 });
    return generateMonthlyPDF(bookId);
  }

  if (type === "period") {
    const hospitalCode = searchParams.get("hospitalCode");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const groupBy = (searchParams.get("groupBy") ?? "doctor") as GroupKey;
    if (!hospitalCode || !from || !to) {
      return Response.json({ error: "hospitalCode, from, to required" }, { status: 400 });
    }
    return generatePeriodPDF(hospitalCode, from, to, groupBy);
  }

  return Response.json({ error: "Invalid request" }, { status: 400 });
}

type GroupKey = "doctor" | "department" | "service" | "day" | "week" | "month" | "shift";

// Friendly labels mirroring the Bookkeeping Departments tab. Aliases are
// normalized so "medication"/"MEDICATION" collapse into "Pharmacy / Drugs",
// "laboratory" into "Laboratory", "radiology" into "Imaging / Radiology", etc.
const SERVICE_LABELS: Record<string, string> = {
  CONSULTATION: "Consultations",
  LAB: "Laboratory",
  IMAGING: "Imaging / Radiology",
  DRUG: "Pharmacy / Drugs",
  WARD_DAY: "Ward Stay",
  PROCEDURE: "Procedures",
  EMERGENCY: "Emergency",
  ICU_DAY: "ICU Stay",
  CARD_FEE: "Patient Cards",
  BOOKING_FEE: "Bookings",
};

function canonicalServiceLabel(raw: string | null | undefined): string {
  if (!raw) return "Uncategorized";
  const u = raw.trim().toUpperCase();
  const canonical =
    u === "MEDICATION" || u === "PHARMACY" ? "DRUG" :
    u === "LABORATORY" ? "LAB" :
    u === "RADIOLOGY" ? "IMAGING" :
    u;
  return SERVICE_LABELS[canonical] ?? canonical.charAt(0) + canonical.slice(1).toLowerCase();
}

// ═══════════════════════════════════════════════════════════════
//  SHARED DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════

const COPPER = "#B87333";
const INK = "#0F172A";
const MUTED = "#64748B";
const RULE = "#E2E8F0";
const SOFT_BG = "#F8FAFC";

const A4 = { width: 595, height: 842, margin: 50, usableWidth: 495 };

// ═══════════════════════════════════════════════════════════════
//  SHARED HELPERS
// ═══════════════════════════════════════════════════════════════

const money = (n: number): string => `GHS ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const whole = (n: number): string => n.toLocaleString("en-US");

// Every text() call MUST pass lineBreak:false when using explicit x,y positioning
// — otherwise pdfkit may trigger an auto-page-break when the cursor falls outside margins.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function txt(doc: any, str: string, x: number, y: number, opts: Record<string, unknown> = {}) {
  doc.text(str, x, y, { lineBreak: false, ...opts });
}

// Auto-fit font size so `str` fits within `maxWidth`. Caller must have already set font family/weight.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fitSize(doc: any, str: string, maxWidth: number, startSize: number, minSize: number): number {
  let size = startSize;
  doc.fontSize(size);
  while (size > minSize && doc.widthOfString(str) > maxWidth) {
    size -= 1;
    doc.fontSize(size);
  }
  return size;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawCover(doc: any, headline: string, hospitalName: string, tagline: string | null, title: string, subtitle: string, tiles: [string, string][]) {
  // ─── Dark cinematic header band ─────────────────────────────
  const BAND_H = 260;
  doc.rect(0, 0, A4.width, BAND_H).fill(INK);

  // Subtle copper hairline at the bottom edge of band
  doc.rect(0, BAND_H - 2, A4.width, 2).fill(COPPER);

  // Eyebrow kicker (copper, all-caps)
  doc.fillColor(COPPER).fontSize(9).font("Helvetica-Bold");
  txt(doc, headline, 50, 70, { characterSpacing: 3 });

  // Hospital name — hero type
  doc.fillColor("white").fontSize(30).font("Helvetica-Bold");
  txt(doc, hospitalName, 50, 100, { width: A4.usableWidth, ellipsis: true });

  // Tagline
  if (tagline) {
    doc.fontSize(12).font("Helvetica").fillColor("#CBD5E1");
    txt(doc, tagline, 50, 145, { width: A4.usableWidth, ellipsis: true });
  }

  // Mini brand lockup pinned to bottom of band (compact version of back cover)
  const lockupY = BAND_H - 54;
  doc.fillColor("white").fontSize(13).font("Helvetica-Bold");
  txt(doc, "DalxicHealth", 50, lockupY);
  doc.fillColor(COPPER).fontSize(7).font("Helvetica-Bold");
  txt(doc, "Powered by Nexus-7", 50, lockupY + 18, { characterSpacing: 1.5 });
  doc.fillColor("#94A3B8").fontSize(6.5).font("Helvetica");
  txt(doc, "health.dalxic.com  ·  A Dalxic subsidiary", 50, lockupY + 32);

  // ─── White stage ────────────────────────────────────────────
  // Title (date range) — medium, not overwhelming
  doc.fillColor(INK).fontSize(26).font("Helvetica-Bold");
  txt(doc, title, 50, BAND_H + 50, { width: A4.usableWidth, ellipsis: true });

  // Subtitle
  doc.fontSize(10).font("Helvetica").fillColor(MUTED);
  txt(doc, subtitle, 50, BAND_H + 90, { width: A4.usableWidth, ellipsis: true });

  // Thin divider
  doc.moveTo(50, BAND_H + 120).lineTo(A4.width - 50, BAND_H + 120).strokeColor(RULE).stroke();

  // ─── KPI tiles — GHS pinned, locked uniform value size across all tiles ───
  const tileY = BAND_H + 150;
  const tileH = 130;
  const tileW = (A4.usableWidth - 30) / 4;
  const innerW = tileW - 28;

  // Lock the value font size to whatever fits a 9-digit amount ("999,999,999.00")
  // on a single line. The SAME size is used across every tile so the far-right
  // tile (non-currency) matches the hero amount. Larger values wrap to next line.
  doc.font("Helvetica-Bold");
  const LOCKED_SIZE = fitSize(doc, "999,999,999.00", innerW, 20, 11);

  // Y-anchors — fixed across all tiles so labels, GHS, and values line up horizontally
  const LABEL_Y = tileY + 16;
  const GHS_Y = tileY + 44;
  const VALUE_Y = tileY + 66;

  tiles.forEach(([label, value], i) => {
    const x = 50 + i * (tileW + 10);
    doc.roundedRect(x, tileY, tileW, tileH, 10).fillAndStroke(SOFT_BG, RULE);

    // Label eyebrow (all-caps, muted)
    doc.fillColor(MUTED).fontSize(8).font("Helvetica-Bold");
    txt(doc, label.toUpperCase(), x + 14, LABEL_Y, { characterSpacing: 1.8, width: innerW });

    const parsed = value.match(/^(GHS)\s+(.+)$/);
    if (parsed) {
      const [, currency, amount] = parsed;
      // Currency ticker — fixed position and size, always on its own line
      doc.fillColor(COPPER).font("Helvetica-Bold").fontSize(9);
      txt(doc, currency, x + 14, GHS_Y, { characterSpacing: 1.5, width: innerW });

      // Amount at locked size; wraps to next line if larger than 9 digits
      doc.fillColor(INK).font("Helvetica-Bold").fontSize(LOCKED_SIZE);
      doc.text(amount, x + 14, VALUE_Y, {
        width: innerW,
        lineBreak: true,
        height: tileH - (VALUE_Y - tileY) - 8,
        ellipsis: true,
      });
    } else {
      // Non-currency — same locked size, same baseline as currency amounts
      doc.fillColor(INK).font("Helvetica-Bold").fontSize(LOCKED_SIZE);
      doc.text(value, x + 14, VALUE_Y, {
        width: innerW,
        lineBreak: true,
        height: tileH - (VALUE_Y - tileY) - 8,
        ellipsis: true,
      });
    }
  });

  // ─── Cover footer — DalxicHealth · Powered by Nexus-7 ───────
  const footerY = A4.height - 90;
  // Copper rule
  doc.rect(50, footerY - 14, 40, 2).fill(COPPER);
  doc.fillColor(INK).fontSize(11).font("Helvetica-Bold");
  txt(doc, "DalxicHealth", 50, footerY);
  doc.fillColor(COPPER).fontSize(9).font("Helvetica-Bold");
  txt(doc, "Powered by Nexus-7", 50, footerY + 18, { characterSpacing: 1.5 });
  doc.fillColor(MUTED).fontSize(8).font("Helvetica");
  txt(doc, "health.dalxic.com   ·   A Dalxic subsidiary", 50, footerY + 36);
}

// Format a date range the Keynote way: "15 Mar — 14 Apr 2026"
function formatDateRange(from: Date, to: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const f = `${from.getDate()} ${months[from.getMonth()]}${from.getFullYear() !== to.getFullYear() ? " " + from.getFullYear() : ""}`;
  const t = `${to.getDate()} ${months[to.getMonth()]} ${to.getFullYear()}`;
  return `${f}  —  ${t}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawSectionHeader(doc: any, title: string, sub: string) {
  doc.fillColor(INK).fontSize(18).font("Helvetica-Bold");
  txt(doc, title, 50, 50);
  doc.fillColor(MUTED).fontSize(10).font("Helvetica");
  txt(doc, sub, 50, 74);
  doc.moveTo(50, 100).lineTo(A4.width - 50, 100).strokeColor(RULE).stroke();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawBackCover(doc: any) {
  doc.rect(0, 0, A4.width, A4.height).fill(INK);
  doc.fillColor("white").fontSize(32).font("Helvetica-Bold");
  txt(doc, "DalxicHealth", 0, A4.height / 2 - 40, { width: A4.width, align: "center" });
  doc.fillColor(COPPER).fontSize(12).font("Helvetica");
  txt(doc, "Powered by Nexus-7", 0, A4.height / 2 + 4, { width: A4.width, align: "center", characterSpacing: 2 });
  doc.fillColor("#94A3B8").fontSize(9);
  txt(doc, "health.dalxic.com  ·  A Dalxic subsidiary", 0, A4.height / 2 + 30, { width: A4.width, align: "center" });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addFooters(doc: any, leftLabel: string) {
  const range = doc.bufferedPageRange();
  const total = range.count;
  for (let i = 0; i < total; i++) {
    doc.switchToPage(range.start + i);
    // skip front cover (0) and back cover (last)
    if (i === 0 || i === total - 1) continue;
    doc.fillColor(MUTED).fontSize(8).font("Helvetica");
    txt(
      doc,
      `${leftLabel}   ·   Page ${i + 1} of ${total}`,
      50,
      A4.height - 30,
      { width: A4.usableWidth, align: "center" }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function newDoc(): { doc: any; pdfPromise: Promise<Uint8Array> } {
  const doc = new PDFDocument({ size: "A4", margin: A4.margin, bufferPages: true });
  const chunks: Uint8Array[] = [];
  doc.on("data", (chunk: Uint8Array) => chunks.push(chunk));
  const pdfPromise = new Promise<Uint8Array>((resolve) => {
    doc.on("end", () => resolve(new Uint8Array(Buffer.concat(chunks))));
  });
  return { doc, pdfPromise };
}

// ═══════════════════════════════════════════════════════════════
//  PATIENT PDF  (single record — kept minimal)
// ═══════════════════════════════════════════════════════════════

async function generatePatientPDF(recordId: string) {
  const record = await db.patientRecord.findUnique({ where: { id: recordId }, include: { hospital: true } });
  if (!record) return Response.json({ error: "Record not found" }, { status: 404 });

  const patient = record.patient as Record<string, string>;
  const visit = record.visit as Record<string, string>;
  const diagnosis = record.diagnosis as Record<string, unknown>;
  const treatment = record.treatment as { prescriptions?: { medication: string; dosage: string; frequency: string; duration: string }[] };

  const { doc, pdfPromise } = newDoc();

  // Header band
  doc.rect(0, 0, A4.width, 140).fill(INK);
  doc.fillColor("white").fontSize(10).font("Helvetica");
  txt(doc, "DALXICHEALTH  —  PATIENT RECORD", 50, 50, { characterSpacing: 2 });
  doc.fontSize(22).font("Helvetica-Bold").fillColor("white");
  txt(doc, record.hospital.name, 50, 78);

  let y = 180;
  const section = (title: string) => {
    doc.fillColor(INK).fontSize(12).font("Helvetica-Bold");
    txt(doc, title, 50, y);
    y += 18;
    doc.moveTo(50, y).lineTo(A4.width - 50, y).strokeColor(RULE).stroke();
    y += 10;
  };
  const row = (k: string, v: string) => {
    doc.fillColor(MUTED).fontSize(10).font("Helvetica");
    txt(doc, k, 50, y, { width: 140 });
    doc.fillColor(INK).font("Helvetica-Bold");
    txt(doc, v, 190, y, { width: A4.usableWidth - 140, ellipsis: true });
    y += 16;
  };

  section("Patient");
  row("Name", patient.fullName ?? "—");
  row("Date of Birth", patient.dateOfBirth ?? "—");
  row("Gender", patient.gender ?? "—");
  row("Phone", patient.phone ?? "—");
  row("Insurance", patient.insuranceId ?? "—");
  y += 12;

  section("Visit");
  row("Date", visit.date ?? "—");
  row("Department", visit.department ?? "—");
  row("Complaint", (visit.chiefComplaint ?? "—").slice(0, 80));
  y += 12;

  section("Diagnosis");
  row("Primary", (diagnosis?.primary as string) ?? "Not recorded");
  if (diagnosis?.notes) row("Notes", (diagnosis.notes as string).slice(0, 120));
  y += 12;

  section("Treatment");
  if (treatment?.prescriptions?.length) {
    treatment.prescriptions.forEach((rx, i) => {
      row(`Rx ${i + 1}`, `${rx.medication} — ${rx.dosage}, ${rx.frequency}, ${rx.duration}`);
    });
  } else {
    doc.fillColor(MUTED).fontSize(10).font("Helvetica");
    txt(doc, "No prescriptions recorded", 50, y);
    y += 16;
  }

  // Footer
  doc.fillColor(COPPER).fontSize(9).font("Helvetica-Bold");
  txt(doc, "DalxicHealth", 50, A4.height - 60);
  doc.fillColor(MUTED).fontSize(8).font("Helvetica");
  txt(doc, "Powered by Nexus-7  ·  health.dalxic.com", 50, A4.height - 46);

  doc.end();
  const buf = await pdfPromise;
  return new Response(buf.buffer as ArrayBuffer, {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="patient-${recordId}.pdf"` },
  });
}

// ═══════════════════════════════════════════════════════════════
//  MONTHLY BOOK PDF
// ═══════════════════════════════════════════════════════════════

async function generateMonthlyPDF(bookId: string) {
  const book = await db.monthlyBook.findUnique({
    where: { id: bookId },
    include: { hospital: true, patientRecords: { orderBy: { createdAt: "asc" } } },
  });
  if (!book) return Response.json({ error: "Book not found" }, { status: 404 });

  const [bills, billables] = await Promise.all([
    db.bill.findMany({ where: { bookId } }),
    db.billableItem.findMany({ where: { bookId } }),
  ]);

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const monthLabel = `${monthNames[book.month - 1]} ${book.year}`;

  const totalBilled = bills.reduce((s, b) => s + b.total, 0);
  const collected = bills.filter(b => b.status === "PAID" || b.status === "PART_PAID").reduce((s, b) => s + b.total, 0);
  const outstanding = bills.filter(b => b.status === "ISSUED").reduce((s, b) => s + b.total, 0);
  const waived = bills.filter(b => b.status === "WAIVED").reduce((s, b) => s + b.total, 0);

  const byMethod = aggregateByKey(bills, b => b.paymentMethod ?? "UNASSIGNED", b => b.total);
  const byService = aggregateByKey(billables, b => b.serviceType, b => b.totalCost);

  const { doc, pdfPromise } = newDoc();

  // ─── Cover ───
  drawCover(
    doc,
    "DALXICHEALTH  —  MONTHLY RECORD BOOK",
    book.hospital.name,
    book.hospital.tagline ?? null,
    monthLabel,
    `${book.status.toUpperCase()}   ·   Closed ${book.closedAt ? new Date(book.closedAt).toLocaleDateString() : "—"}   ·   Generated ${new Date().toLocaleDateString()}`,
    [
      ["Patients", whole(book.patientRecords.length)],
      ["Bills Issued", whole(bills.length)],
      ["Gross Billed", money(totalBilled)],
      ["Collected", money(collected)],
    ]
  );

  // ─── Finance Summary ───
  doc.addPage();
  drawSectionHeader(doc, "Finance Summary", monthLabel);

  let y = 120;
  doc.fillColor(INK).fontSize(11).font("Helvetica-Bold");
  txt(doc, "Revenue Flow", 50, y);
  y += 24;

  const rev: [string, string][] = [
    ["Total Billed", money(totalBilled)],
    ["Collected (Paid + Part-Paid)", money(collected)],
    ["Outstanding (Issued)", money(outstanding)],
    ["Waived", money(waived)],
  ];
  rev.forEach(([k, v]) => {
    doc.fillColor(MUTED).fontSize(10).font("Helvetica");
    txt(doc, k, 50, y);
    doc.fillColor(INK).font("Helvetica-Bold");
    txt(doc, v, A4.width - 50 - 180, y, { width: 180, align: "right" });
    y += 18;
  });

  y += 18;
  y = drawTable(doc, y, "Payment Methods", ["METHOD", "COUNT", "AMOUNT"], [245, 65], byMethod);

  y += 18;
  y = drawTable(doc, y, "Service Breakdown", ["SERVICE", "ITEMS", "AMOUNT"], [245, 65], byService);

  // ─── Patient Index ───
  if (book.patientRecords.length > 0) {
    doc.addPage();
    drawSectionHeader(doc, "Patient Index", `${whole(book.patientRecords.length)} records · ${monthLabel}`);
    drawPatientIndexHeader(doc, 118);
    let py = 136;

    book.patientRecords.forEach((record, i) => {
      if (py > A4.height - 70) {
        doc.addPage();
        doc.fillColor(MUTED).fontSize(9).font("Helvetica");
        txt(doc, `Patient Index (continued)  ·  ${monthLabel}`, 50, 50);
        doc.moveTo(50, 70).lineTo(A4.width - 50, 70).strokeColor(RULE).stroke();
        drawPatientIndexHeader(doc, 84);
        py = 102;
      }
      const patient = record.patient as Record<string, string>;
      const visit = record.visit as Record<string, string>;
      const diagnosis = record.diagnosis as Record<string, unknown>;
      const dateStr = visit.date
        ? new Date(visit.date).toLocaleDateString()
        : new Date(record.createdAt).toLocaleDateString();
      drawPatientRow(doc, py, i + 1, patient.fullName ?? "Unknown", dateStr, visit.chiefComplaint ?? "—", (diagnosis?.primary as string) ?? "—");
      py += 16;
    });
  }

  // ─── Back cover ───
  doc.addPage();
  drawBackCover(doc);

  addFooters(doc, `${book.hospital.name}  ·  ${monthLabel}`);

  doc.end();
  const buf = await pdfPromise;
  return new Response(buf.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="book-${book.year}-${book.month}.pdf"`,
    },
  });
}

// ═══════════════════════════════════════════════════════════════
//  PERIOD (date-range) FINANCE PDF
// ═══════════════════════════════════════════════════════════════

async function generatePeriodPDF(hospitalCode: string, fromStr: string, toStr: string, groupBy: GroupKey) {
  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  const from = new Date(fromStr);
  const to = new Date(toStr);
  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return Response.json({ error: "Invalid from/to" }, { status: 400 });
  }

  const [bills, billables, doctors] = await Promise.all([
    db.bill.findMany({ where: { hospitalId: hospital.id, createdAt: { gte: from, lte: to } } }),
    db.billableItem.findMany({ where: { hospitalId: hospital.id, renderedAt: { gte: from, lte: to } } }),
    db.doctor.findMany({ where: { hospitalId: hospital.id } }),
  ]);

  const doctorName: Record<string, string> = Object.fromEntries(doctors.map(d => [d.id, d.name]));

  const totalBilled = bills.reduce((s, b) => s + b.total, 0);
  const collected = bills.filter(b => b.status === "PAID" || b.status === "PART_PAID").reduce((s, b) => s + b.total, 0);
  const outstanding = bills.filter(b => b.status === "ISSUED").reduce((s, b) => s + b.total, 0);
  const waived = bills.filter(b => b.status === "WAIVED").reduce((s, b) => s + b.total, 0);
  const gross = billables.reduce((s, b) => s + b.totalCost, 0);
  const staffCut = billables.reduce((s, b) => s + (b.staffCutCost ?? 0), 0);
  const net = gross - staffCut;
  const patientIds = new Set(billables.map(b => b.patientId));

  const byMethod = aggregateByKey(bills, b => b.paymentMethod ?? "UNASSIGNED", b => b.total);

  const groupKey = (b: typeof billables[number]): string => {
    if (groupBy === "doctor") return b.doctorId ? (doctorName[b.doctorId] ?? b.doctorId.slice(0, 8)) : "Unassigned";
    if (groupBy === "department") return b.departmentId ?? "—";
    if (groupBy === "service") return canonicalServiceLabel(b.serviceType);
    if (groupBy === "shift") return b.shiftId ?? "No shift";
    const d = new Date(b.renderedAt);
    if (groupBy === "day") return d.toISOString().slice(0, 10);
    if (groupBy === "month") return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const week = Math.ceil(((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 86400000 + new Date(d.getFullYear(), 0, 1).getDay() + 1) / 7);
    return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
  };

  const groups: Record<string, { gross: number; cut: number; items: number; patients: Set<string> }> = {};
  for (const b of billables) {
    const k = groupKey(b);
    groups[k] = groups[k] || { gross: 0, cut: 0, items: 0, patients: new Set() };
    groups[k].gross += b.totalCost;
    groups[k].cut += b.staffCutCost ?? 0;
    groups[k].items++;
    groups[k].patients.add(b.patientId);
  }

  const { doc, pdfPromise } = newDoc();
  const periodLabel = formatDateRange(from, to);

  // ─── Cover ───
  drawCover(
    doc,
    "DALXICHEALTH  —  FINANCE PERIOD REPORT",
    hospital.name,
    hospital.tagline ?? null,
    periodLabel,
    `Grouped by ${groupBy}   ·   Generated ${new Date().toLocaleString()}`,
    [
      ["Gross Revenue", money(gross)],
      ["Hospital Net", money(net)],
      ["Staff Cut", money(staffCut)],
      ["Patients", whole(patientIds.size)],
    ]
  );

  // ─── Revenue & Billing ───
  doc.addPage();
  drawSectionHeader(doc, "Revenue & Billing", periodLabel);

  let y = 120;
  doc.fillColor(INK).fontSize(11).font("Helvetica-Bold");
  txt(doc, "Bill Status", 50, y);
  y += 24;
  const rows: [string, string][] = [
    ["Total Billed", money(totalBilled)],
    ["Collected (Paid + Part-Paid)", money(collected)],
    ["Outstanding (Issued)", money(outstanding)],
    ["Waived", money(waived)],
    ["Bills Issued", whole(bills.length)],
  ];
  rows.forEach(([k, v]) => {
    doc.fillColor(MUTED).fontSize(10).font("Helvetica");
    txt(doc, k, 50, y);
    doc.fillColor(INK).font("Helvetica-Bold");
    txt(doc, v, A4.width - 50 - 180, y, { width: 180, align: "right" });
    y += 18;
  });

  y += 18;
  y = drawTable(doc, y, "Payment Methods", ["METHOD", "COUNT", "AMOUNT"], [245, 65], byMethod);

  // ─── Breakdown ───
  doc.addPage();
  drawSectionHeader(doc, `Breakdown by ${groupBy}`, periodLabel);
  let gy = drawBreakdownHeader(doc, 118, groupBy);

  const sorted = Object.entries(groups).sort((a, b) => b[1].gross - a[1].gross);
  for (const [k, g] of sorted) {
    if (gy > A4.height - 70) {
      doc.addPage();
      doc.fillColor(MUTED).fontSize(9).font("Helvetica");
      txt(doc, `Breakdown by ${groupBy}  (continued)  ·  ${periodLabel}`, 50, 50);
      doc.moveTo(50, 70).lineTo(A4.width - 50, 70).strokeColor(RULE).stroke();
      gy = drawBreakdownHeader(doc, 84, groupBy);
    }
    drawBreakdownRow(doc, gy, k, g);
    gy += 16;
  }

  // ─── Back Cover ───
  doc.addPage();
  drawBackCover(doc);

  addFooters(doc, `${hospital.name}  ·  ${periodLabel}`);

  doc.end();
  const buf = await pdfPromise;
  const slug = `${from.toISOString().slice(0, 10)}_${to.toISOString().slice(0, 10)}_${groupBy}`;
  return new Response(buf.buffer as ArrayBuffer, {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="finance-${slug}.pdf"` },
  });
}

// ═══════════════════════════════════════════════════════════════
//  TABLE HELPERS
// ═══════════════════════════════════════════════════════════════

function aggregateByKey<T>(items: T[], keyFn: (t: T) => string, valueFn: (t: T) => number): Record<string, { count: number; amount: number }> {
  const out: Record<string, { count: number; amount: number }> = {};
  for (const item of items) {
    const k = keyFn(item);
    out[k] = out[k] || { count: 0, amount: 0 };
    out[k].count++;
    out[k].amount += valueFn(item);
  }
  return out;
}

// 2-number-column table: [label | count | amount]
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawTable(doc: any, y: number, title: string, _headers: [string, string, string], _colWidths: [number, number], data: Record<string, { count: number; amount: number }>): number {
  const entries = Object.entries(data).sort((a, b) => b[1].amount - a[1].amount);
  if (entries.length === 0) {
    doc.fillColor(INK).fontSize(11).font("Helvetica-Bold");
    txt(doc, title, 50, y);
    y += 24;
    doc.fillColor(MUTED).fontSize(10).font("Helvetica");
    txt(doc, "No data in this period.", 50, y);
    return y + 20;
  }

  doc.fillColor(INK).fontSize(11).font("Helvetica-Bold");
  txt(doc, title, 50, y);
  y += 22;

  // Column layout (x, width, align)
  const LABEL_X = 50, LABEL_W = 240;
  const COUNT_RIGHT = 360;  // right edge of count
  const AMOUNT_RIGHT = A4.width - 50; // = 545
  const COUNT_W = 60;
  const AMOUNT_W = 160;

  doc.fillColor(MUTED).fontSize(8).font("Helvetica");
  txt(doc, _headers[0], LABEL_X, y, { characterSpacing: 1, width: LABEL_W });
  txt(doc, _headers[1], COUNT_RIGHT - COUNT_W, y, { characterSpacing: 1, width: COUNT_W, align: "right" });
  txt(doc, _headers[2], AMOUNT_RIGHT - AMOUNT_W, y, { characterSpacing: 1, width: AMOUNT_W, align: "right" });
  y += 14;
  doc.moveTo(50, y).lineTo(A4.width - 50, y).strokeColor(RULE).stroke();
  y += 8;

  for (const [k, { count, amount }] of entries) {
    if (y > A4.height - 80) {
      doc.addPage();
      y = 60;
    }
    doc.fillColor(INK).fontSize(10).font("Helvetica");
    txt(doc, k, LABEL_X, y, { width: LABEL_W, ellipsis: true });
    txt(doc, whole(count), COUNT_RIGHT - COUNT_W, y, { width: COUNT_W, align: "right" });
    doc.font("Helvetica-Bold");
    txt(doc, money(amount), AMOUNT_RIGHT - AMOUNT_W, y, { width: AMOUNT_W, align: "right" });
    y += 16;
  }
  return y;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawPatientIndexHeader(doc: any, y: number) {
  doc.fillColor(MUTED).fontSize(8).font("Helvetica");
  const cs = { characterSpacing: 1 };
  txt(doc, "#", 50, y, { ...cs, width: 25 });
  txt(doc, "PATIENT", 80, y, { ...cs, width: 160 });
  txt(doc, "DATE", 245, y, { ...cs, width: 70 });
  txt(doc, "COMPLAINT", 320, y, { ...cs, width: 150 });
  txt(doc, "DIAGNOSIS", 475, y, { ...cs, width: 70 });
  doc.moveTo(50, y + 12).lineTo(A4.width - 50, y + 12).strokeColor(RULE).stroke();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawPatientRow(doc: any, y: number, n: number, name: string, date: string, complaint: string, dx: string) {
  doc.fillColor(MUTED).fontSize(9).font("Helvetica");
  txt(doc, whole(n), 50, y, { width: 25 });
  doc.fillColor(INK).font("Helvetica-Bold");
  txt(doc, name, 80, y, { width: 160, ellipsis: true });
  doc.font("Helvetica");
  txt(doc, date, 245, y, { width: 70 });
  txt(doc, complaint, 320, y, { width: 150, ellipsis: true });
  txt(doc, dx, 475, y, { width: 70, ellipsis: true });
}

// Breakdown: [name | gross | staff cut | net | items | patients]
// Column layout — right-edge anchored, widths tuned so the PATIENTS header fits
const BD = {
  nameX: 50, nameW: 140,
  grossRight: 275, grossW: 80,
  cutRight: 355, cutW: 80,
  netRight: 430, netW: 75,
  itemsRight: 475, itemsW: 40,
  patientsRight: 545, patientsW: 60,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawBreakdownHeader(doc: any, y: number, groupBy: string): number {
  doc.fillColor(MUTED).fontSize(8).font("Helvetica");
  const cs = { characterSpacing: 1 };
  txt(doc, groupBy.toUpperCase(), BD.nameX, y, { ...cs, width: BD.nameW });
  txt(doc, "GROSS", BD.grossRight - BD.grossW, y, { ...cs, width: BD.grossW });
  txt(doc, "STAFF CUT", BD.cutRight - BD.cutW, y, { ...cs, width: BD.cutW });
  txt(doc, "NET", BD.netRight - BD.netW, y, { ...cs, width: BD.netW });
  txt(doc, "ITEMS", BD.itemsRight - BD.itemsW, y, { ...cs, width: BD.itemsW });
  txt(doc, "PATIENTS", BD.patientsRight - BD.patientsW, y, { ...cs, width: BD.patientsW });
  doc.moveTo(50, y + 12).lineTo(A4.width - 50, y + 12).strokeColor(RULE).stroke();
  return y + 20;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function drawBreakdownRow(doc: any, y: number, name: string, g: { gross: number; cut: number; items: number; patients: Set<string> }) {
  doc.fillColor(INK).fontSize(9).font("Helvetica-Bold");
  txt(doc, name, BD.nameX, y, { width: BD.nameW, ellipsis: true });
  doc.font("Helvetica");
  txt(doc, money(g.gross), BD.grossRight - BD.grossW, y, { width: BD.grossW });
  txt(doc, money(g.cut), BD.cutRight - BD.cutW, y, { width: BD.cutW });
  txt(doc, money(g.gross - g.cut), BD.netRight - BD.netW, y, { width: BD.netW });
  txt(doc, whole(g.items), BD.itemsRight - BD.itemsW, y, { width: BD.itemsW });
  txt(doc, whole(g.patients.size), BD.patientsRight - BD.patientsW, y, { width: BD.patientsW });
}
