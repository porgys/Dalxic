import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

// GET: aggregated revenue
//   ?hospitalCode=KBH&from=ISO&to=ISO&groupBy=doctor|department|shift|day|week|month|service
export async function GET(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;
  const { searchParams } = new URL(request.url);
  const hospitalCode = searchParams.get("hospitalCode");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const groupBy = (searchParams.get("groupBy") || "doctor").toLowerCase();
  const doctorId = searchParams.get("doctorId");
  const department = searchParams.get("department");

  if (!hospitalCode) return Response.json({ error: "hospitalCode required" }, { status: 400 });

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  const fromDate = from ? new Date(from) : new Date(new Date().setDate(new Date().getDate() - 30));
  const toDate = to ? new Date(to) : new Date();

  const items = await db.billableItem.findMany({
    where: {
      hospitalId: hospital.id,
      renderedAt: { gte: fromDate, lte: toDate },
      ...(doctorId ? { doctorId } : {}),
      ...(department ? { departmentId: department } : {}),
    },
    select: {
      id: true, totalCost: true, staffCutCost: true,
      doctorId: true, departmentId: true, shiftId: true,
      serviceType: true, renderedAt: true, patientId: true,
    },
  });

  const totalGross = items.reduce((s, i) => s + i.totalCost, 0);
  const totalStaffCut = items.reduce((s, i) => s + (i.staffCutCost ?? 0), 0);
  const totalHospitalNet = totalGross - totalStaffCut;
  const totalPatients = new Set(items.map((i) => i.patientId)).size;

  // Aggregation buckets
  type Bucket = { key: string; label: string; gross: number; staffCut: number; net: number; items: number; patients: Set<string> };
  const buckets = new Map<string, Bucket>();

  const bucket = (key: string, label: string) => {
    let b = buckets.get(key);
    if (!b) {
      b = { key, label, gross: 0, staffCut: 0, net: 0, items: 0, patients: new Set() };
      buckets.set(key, b);
    }
    return b;
  };

  const dayKey = (d: Date) => d.toISOString().slice(0, 10);
  const weekKey = (d: Date) => {
    const onejan = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
  };
  const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

  for (const it of items) {
    let key = "unknown", label = "Unknown";
    const r = new Date(it.renderedAt);
    switch (groupBy) {
      case "doctor":     key = it.doctorId ?? "unassigned"; label = key; break;
      case "department": key = it.departmentId ?? "unassigned"; label = key; break;
      case "shift":      key = it.shiftId ?? "no_shift"; label = key; break;
      case "service":    key = it.serviceType; label = it.serviceType; break;
      case "day":        key = dayKey(r); label = key; break;
      case "week":       key = weekKey(r); label = key; break;
      case "month":      key = monthKey(r); label = key; break;
    }
    const b = bucket(key, label);
    b.gross += it.totalCost;
    b.staffCut += it.staffCutCost ?? 0;
    b.items += 1;
    b.patients.add(it.patientId);
  }

  // Enrich doctor labels
  if (groupBy === "doctor") {
    const ids = Array.from(buckets.keys()).filter((k) => k !== "unassigned");
    const docs = await db.doctor.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, specialty: true, commissionRate: true, department: true },
    });
    for (const d of docs) {
      const b = buckets.get(d.id);
      if (b) b.label = `${d.name} (${d.specialty})`;
    }
  }

  // Enrich shift labels with doctor name + times
  if (groupBy === "shift") {
    const ids = Array.from(buckets.keys()).filter((k) => k !== "no_shift");
    const shifts = await db.doctorShift.findMany({
      where: { id: { in: ids } },
      include: { doctor: { select: { name: true } } },
    });
    for (const s of shifts) {
      const b = buckets.get(s.id);
      if (b) {
        const end = s.clockOutAt ? s.clockOutAt.toISOString().slice(11, 16) : "live";
        b.label = `${s.doctor.name} · ${s.shiftType} · ${s.clockInAt.toISOString().slice(11, 16)}–${end}`;
      }
    }
  }

  const rows = Array.from(buckets.values())
    .map((b) => ({
      key: b.key,
      label: b.label,
      gross: Math.round(b.gross * 100) / 100,
      staffCut: Math.round(b.staffCut * 100) / 100,
      net: Math.round((b.gross - b.staffCut) * 100) / 100,
      items: b.items,
      patients: b.patients.size,
    }))
    .sort((a, b) => b.gross - a.gross);

  return Response.json({
    from: fromDate.toISOString(),
    to: toDate.toISOString(),
    groupBy,
    totals: {
      gross: Math.round(totalGross * 100) / 100,
      staffCut: Math.round(totalStaffCut * 100) / 100,
      net: Math.round(totalHospitalNet * 100) / 100,
      items: items.length,
      patients: totalPatients,
    },
    rows,
  });
}
