import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

// Canonicalize raw serviceType strings (any case, aliases) to one of the 8
// friendly buckets the frontend SERVICE_LABELS knows about. Prevents duplicate
// rows like "consultation"/"CONSULTATION" and merges aliases like MEDICATION→DRUG.
function canonicalServiceType(raw: string | null | undefined): string {
  if (!raw) return "OTHER";
  const u = raw.trim().toUpperCase();
  if (u === "MEDICATION" || u === "PHARMACY") return "DRUG";
  if (u === "LABORATORY") return "LAB";
  if (u === "RADIOLOGY") return "IMAGING";
  return u;
}

// GET: Aggregate billing data for bookkeeping dashboards
export async function GET(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;
  const { searchParams } = new URL(request.url);
  const hospitalCode = searchParams.get("hospitalCode");
  const view = searchParams.get("view"); // "summary" | "revenue" | "claims" | "outstanding" | "department"
  const period = searchParams.get("period") || "today"; // today | week | month | year

  if (!hospitalCode) {
    return Response.json({ error: "hospitalCode required" }, { status: 400 });
  }

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  const now = new Date();
  const periodStart = getPeriodStart(now, period);

  // ── Summary Dashboard ──
  if (!view || view === "summary") {
    const [
      totalBills,
      paidBills,
      pendingBills,
      periodItems,
      periodBills,
    ] = await Promise.all([
      db.bill.count({ where: { hospitalId: hospital.id } }),
      db.bill.findMany({ where: { hospitalId: hospital.id, status: "PAID", paidAt: { gte: periodStart } } }),
      db.bill.findMany({ where: { hospitalId: hospital.id, status: { in: ["DRAFT", "ISSUED", "PART_PAID"] } } }),
      db.billableItem.findMany({ where: { hospitalId: hospital.id, renderedAt: { gte: periodStart } } }),
      db.bill.findMany({ where: { hospitalId: hospital.id, createdAt: { gte: periodStart } }, include: { items: true } }),
    ]);

    const revenue = paidBills.reduce((s, b) => s + b.total, 0);
    const outstanding = pendingBills.reduce((s, b) => s + b.total, 0);
    const itemsTotal = periodItems.reduce((s, i) => s + i.totalCost, 0);
    const discountTotal = periodBills.reduce((s, b) => s + b.discount, 0);
    const waivedBills = periodBills.filter(b => b.status === "WAIVED");
    const waivedTotal = waivedBills.reduce((s, b) => s + b.total, 0);

    // Payment method breakdown
    const paymentBreakdown: Record<string, number> = {};
    paidBills.forEach(b => {
      const method = b.paymentMethod || "UNKNOWN";
      paymentBreakdown[method] = (paymentBreakdown[method] || 0) + b.total;
    });

    return Response.json({
      period,
      periodStart: periodStart.toISOString(),
      totalBillsAllTime: totalBills,
      periodRevenue: revenue,
      periodBillCount: periodBills.length,
      periodItemCount: periodItems.length,
      periodItemsTotal: itemsTotal,
      periodDiscounts: discountTotal,
      periodWaived: waivedTotal,
      outstandingAmount: outstanding,
      outstandingCount: pendingBills.length,
      paymentBreakdown,
    });
  }

  // ── Revenue Breakdown By Day ──
  if (view === "revenue") {
    const bills = await db.bill.findMany({
      where: { hospitalId: hospital.id, status: "PAID", paidAt: { gte: periodStart } },
      orderBy: { paidAt: "asc" },
    });

    // Group by date
    const byDate: Record<string, { revenue: number; count: number }> = {};
    bills.forEach(b => {
      const dateKey = (b.paidAt || b.createdAt).toISOString().split("T")[0];
      if (!byDate[dateKey]) byDate[dateKey] = { revenue: 0, count: 0 };
      byDate[dateKey].revenue += b.total;
      byDate[dateKey].count += 1;
    });

    return Response.json({
      period,
      daily: Object.entries(byDate).map(([date, d]) => ({ date, ...d })),
      total: bills.reduce((s, b) => s + b.total, 0),
    });
  }

  // ── Department Breakdown (by service type) ──
  if (view === "department") {
    const items = await db.billableItem.findMany({
      where: { hospitalId: hospital.id, renderedAt: { gte: periodStart } },
    });

    const byType: Record<string, { count: number; total: number }> = {};
    items.forEach(i => {
      const key = canonicalServiceType(i.serviceType);
      if (!byType[key]) byType[key] = { count: 0, total: 0 };
      byType[key].count += 1;
      byType[key].total += i.totalCost;
    });

    return Response.json({
      period,
      departments: Object.entries(byType)
        .map(([type, d]) => ({ serviceType: type, ...d }))
        .sort((a, b) => b.total - a.total),
      grandTotal: items.reduce((s, i) => s + i.totalCost, 0),
    });
  }

  // ── Outstanding Balances ──
  if (view === "outstanding") {
    const unpaid = await db.bill.findMany({
      where: { hospitalId: hospital.id, status: { in: ["DRAFT", "ISSUED", "PART_PAID"] } },
      orderBy: { createdAt: "asc" },
    });

    // Aging buckets
    const aging = { current: 0, days30: 0, days60: 0, days90: 0 };
    const nowMs = now.getTime();
    unpaid.forEach(b => {
      const ageMs = nowMs - b.createdAt.getTime();
      const ageDays = ageMs / (1000 * 60 * 60 * 24);
      if (ageDays <= 30) aging.current += b.total;
      else if (ageDays <= 60) aging.days30 += b.total;
      else if (ageDays <= 90) aging.days60 += b.total;
      else aging.days90 += b.total;
    });

    return Response.json({
      bills: unpaid.map(b => ({
        billNumber: b.billNumber,
        patientId: b.patientId,
        total: b.total,
        status: b.status,
        createdAt: b.createdAt,
        ageDays: Math.floor((nowMs - b.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
      })),
      aging,
      totalOutstanding: unpaid.reduce((s, b) => s + b.total, 0),
    });
  }

  // ── Claims (Insurance Payments) ──
  if (view === "claims") {
    const insuranceBills = await db.bill.findMany({
      where: {
        hospitalId: hospital.id,
        paymentMethod: { in: ["INSURANCE", "NHIS"] },
        createdAt: { gte: periodStart },
      },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    const paid = insuranceBills.filter(b => b.status === "PAID");
    const pending = insuranceBills.filter(b => b.status !== "PAID" && b.status !== "WAIVED");

    return Response.json({
      period,
      totalClaims: insuranceBills.length,
      paidClaims: paid.length,
      paidTotal: paid.reduce((s, b) => s + b.total, 0),
      pendingClaims: pending.length,
      pendingTotal: pending.reduce((s, b) => s + b.total, 0),
      claims: insuranceBills.map(b => ({
        billNumber: b.billNumber,
        patientId: b.patientId,
        total: b.total,
        status: b.status,
        paymentMethod: b.paymentMethod,
        createdAt: b.createdAt,
        itemCount: b.items.length,
      })),
    });
  }

  // ── Patient Records Ledger ──
  if (view === "patients") {
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = 30;

    const where: Record<string, unknown> = { hospitalId: hospital.id };
    if (period !== "year") {
      where.createdAt = { gte: periodStart };
    }

    const [records, total] = await Promise.all([
      db.patientRecord.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      db.patientRecord.count({ where }),
    ]);

    // Extract patient data from JSON and filter by search
    const patients = records.map(r => {
      const patient = r.patient as Record<string, unknown> || {};
      const visit = r.visit as Record<string, unknown> || {};
      const diagnosis = r.diagnosis as Record<string, unknown> || {};
      const treatment = r.treatment as Record<string, unknown> || {};
      return {
        id: r.id,
        name: patient.fullName || "Unknown",
        phone: patient.phone || null,
        gender: patient.gender || null,
        dateOfBirth: patient.dateOfBirth || null,
        insuranceId: patient.insuranceId || null,
        insuranceScheme: patient.insuranceScheme || null,
        queueToken: visit.queueToken || null,
        chiefComplaint: visit.chiefComplaint || null,
        department: visit.department || null,
        visitStatus: visit.status || visit.visitStatus || null,
        primaryDiagnosis: diagnosis.primary || null,
        prescriptionCount: Array.isArray((treatment as Record<string, unknown>).prescriptions) ? ((treatment as Record<string, unknown>).prescriptions as unknown[]).length : 0,
        visitDate: r.createdAt,
        entryPoint: r.entryPoint,
      };
    }).filter(p => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        ((p.name as string) ?? "").toLowerCase().includes(s) ||
        (p.phone && (p.phone as string).includes(s)) ||
        (p.queueToken && ((p.queueToken as string) ?? "").toLowerCase().includes(s))
      );
    });

    return Response.json({
      patients,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  }

  // ── Patient Detail (full visit history for one patient by phone or name) ──
  if (view === "patient-history") {
    const patientId = searchParams.get("patientId");
    if (!patientId) return Response.json({ error: "patientId required" }, { status: 400 });

    const record = await db.patientRecord.findUnique({ where: { id: patientId } });
    if (!record) return Response.json({ error: "Record not found" }, { status: 404 });

    const patient = record.patient as Record<string, unknown> || {};
    const phone = patient.phone as string || "";
    const name = patient.fullName as string || "";

    // Find all records for this patient (by phone match)
    const allRecords = await db.patientRecord.findMany({
      where: {
        hospitalId: hospital.id,
        ...(phone ? {} : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // Filter by phone or exact name match
    const history = allRecords.filter(r => {
      const p = r.patient as Record<string, unknown> || {};
      if (phone && p.phone === phone) return true;
      if (name && p.fullName === name) return true;
      return r.id === patientId;
    }).map(r => {
      const v = r.visit as Record<string, unknown> || {};
      const d = r.diagnosis as Record<string, unknown> || {};
      const t = r.treatment as Record<string, unknown> || {};
      return {
        id: r.id,
        queueToken: v.queueToken,
        chiefComplaint: v.chiefComplaint,
        department: v.department,
        visitStatus: v.status || v.visitStatus,
        primaryDiagnosis: d.primary,
        notes: d.notes,
        prescriptions: (t as Record<string, unknown>).prescriptions || [],
        visitDate: r.createdAt,
      };
    });

    return Response.json({
      patient: {
        name, phone,
        gender: patient.gender,
        dateOfBirth: patient.dateOfBirth,
        insuranceId: patient.insuranceId,
        insuranceScheme: patient.insuranceScheme,
        emergencyContact: patient.emergencyContact,
      },
      totalVisits: history.length,
      visits: history,
    });
  }

  // ── Weekly/Monthly Assessment Summary ──
  if (view === "assessment") {
    // Aggregate stats by week or month
    const records = await db.patientRecord.findMany({
      where: { hospitalId: hospital.id, createdAt: { gte: periodStart } },
      orderBy: { createdAt: "asc" },
    });

    const bills = await db.bill.findMany({
      where: { hospitalId: hospital.id, createdAt: { gte: periodStart } },
    });

    // Group by week or day depending on period
    const buckets: Record<string, { patients: number; revenue: number; diagnoses: Record<string, number> }> = {};

    records.forEach(r => {
      const date = r.createdAt;
      const key = period === "today"
        ? `${date.getHours()}:00`
        : period === "week"
        ? ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][date.getDay()]
        : period === "month"
        ? `Week ${Math.ceil(date.getDate() / 7)}`
        : date.toLocaleString("default", { month: "short" });

      if (!buckets[key]) buckets[key] = { patients: 0, revenue: 0, diagnoses: {} };
      buckets[key].patients += 1;

      const diag = r.diagnosis as Record<string, unknown> || {};
      const primary = (diag.primary as string) || "Undiagnosed";
      buckets[key].diagnoses[primary] = (buckets[key].diagnoses[primary] || 0) + 1;
    });

    bills.forEach(b => {
      const date = b.createdAt;
      const key = period === "today"
        ? `${date.getHours()}:00`
        : period === "week"
        ? ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][date.getDay()]
        : period === "month"
        ? `Week ${Math.ceil(date.getDate() / 7)}`
        : date.toLocaleString("default", { month: "short" });

      if (!buckets[key]) buckets[key] = { patients: 0, revenue: 0, diagnoses: {} };
      if (b.status === "PAID") buckets[key].revenue += b.total;
    });

    // Top diagnoses across period
    const allDiag: Record<string, number> = {};
    records.forEach(r => {
      const d = r.diagnosis as Record<string, unknown> || {};
      const primary = (d.primary as string) || "Undiagnosed";
      allDiag[primary] = (allDiag[primary] || 0) + 1;
    });
    const topDiagnoses = Object.entries(allDiag)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([diagnosis, count]) => ({ diagnosis, count }));

    return Response.json({
      period,
      totalPatients: records.length,
      totalRevenue: bills.filter(b => b.status === "PAID").reduce((s, b) => s + b.total, 0),
      buckets: Object.entries(buckets).map(([label, data]) => ({ label, ...data })),
      topDiagnoses,
    });
  }

  return Response.json({ error: "Invalid view" }, { status: 400 });
}

function getPeriodStart(now: Date, period: string): Date {
  const start = new Date(now);
  switch (period) {
    case "today":
      start.setHours(0, 0, 0, 0);
      break;
    case "week":
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;
    case "month":
      start.setMonth(start.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
      break;
    case "year":
      start.setFullYear(start.getFullYear() - 1);
      start.setHours(0, 0, 0, 0);
      break;
    default:
      start.setHours(0, 0, 0, 0);
  }
  return start;
}
