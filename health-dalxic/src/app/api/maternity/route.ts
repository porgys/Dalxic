import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { createBillableItem } from "@/lib/billing";

// GET: Get maternity patients
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hospitalCode = searchParams.get("hospitalCode");
  const view = searchParams.get("view"); // antenatal | labour | postnatal | all

  if (!hospitalCode) return Response.json({ error: "hospitalCode required" }, { status: 400 });

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  const records = await db.patientRecord.findMany({
    where: { hospitalId: hospital.id },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  type MaternityData = {
    stage: string; // antenatal | labour | postnatal | discharged
    edd?: string;
    gravida?: number;
    para?: number;
    gestationalWeeks?: number;
    admittedAt?: string;
    admittedBy?: string;
    deliveredAt?: string;
    deliveryMode?: string;
    babyWeight?: number;
    babyGender?: string;
    apgarScores?: string;
    complications?: string;
    dischargedAt?: string;
    visits?: Array<{ id: string; date: string; type: string; notes: string; recordedBy: string }>;
  };

  const maternityPatients = records
    .filter((r) => {
      const visit = r.visit as { maternity?: MaternityData };
      return visit.maternity && visit.maternity.stage !== "discharged";
    })
    .map((r) => {
      const patient = r.patient as { fullName: string; age?: number };
      const visit = r.visit as { queueToken: string; department: string; maternity: MaternityData };
      const mat = visit.maternity;
      return {
        recordId: r.id,
        patientName: patient.fullName,
        age: patient.age,
        queueToken: visit.queueToken,
        stage: mat.stage,
        edd: mat.edd,
        gravida: mat.gravida,
        para: mat.para,
        gestationalWeeks: mat.gestationalWeeks,
        admittedAt: mat.admittedAt,
        deliveredAt: mat.deliveredAt,
        deliveryMode: mat.deliveryMode,
        babyWeight: mat.babyWeight,
        babyGender: mat.babyGender,
        apgarScores: mat.apgarScores,
        visitsCount: (mat.visits || []).length,
      };
    });

  const filtered = view && view !== "all"
    ? maternityPatients.filter((p) => p.stage === view)
    : maternityPatients;

  const counts = {
    antenatal: maternityPatients.filter((p) => p.stage === "antenatal").length,
    labour: maternityPatients.filter((p) => p.stage === "labour").length,
    postnatal: maternityPatients.filter((p) => p.stage === "postnatal").length,
    total: maternityPatients.length,
  };

  return Response.json({ patients: filtered, counts });
}

// POST: Register, update stage, record visit, delivery
export async function POST(request: Request) {
  const body = await request.json();
  const { hospitalCode, action } = body;

  if (!hospitalCode || !action) return Response.json({ error: "hospitalCode and action required" }, { status: 400 });

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  // Register antenatal patient
  if (action === "register") {
    const { recordId, edd, gravida, para, gestationalWeeks, admittedBy } = body;
    if (!recordId) return Response.json({ error: "recordId required" }, { status: 400 });

    const record = await db.patientRecord.findUnique({ where: { id: recordId } });
    if (!record) return Response.json({ error: "Record not found" }, { status: 404 });

    const visit = record.visit as Record<string, unknown>;
    visit.maternity = {
      stage: "antenatal",
      edd: edd || null,
      gravida: gravida || null,
      para: para || null,
      gestationalWeeks: gestationalWeeks || null,
      admittedAt: new Date().toISOString(),
      admittedBy: admittedBy || "midwife",
      visits: [],
    };

    await db.patientRecord.update({ where: { id: recordId }, data: { visit: JSON.parse(JSON.stringify(visit)) } });

    await logAudit({ actorType: "device_operator", actorId: admittedBy || "midwife", hospitalId: hospital.id, action: "maternity.registered", metadata: { recordId, stage: "antenatal" }, ipAddress: getClientIP(request) });

    return Response.json({ success: true }, { status: 201 });
  }

  // Record antenatal/postnatal visit
  if (action === "record_visit") {
    const { recordId, type, notes, recordedBy } = body;
    if (!recordId || !notes) return Response.json({ error: "recordId and notes required" }, { status: 400 });

    const record = await db.patientRecord.findUnique({ where: { id: recordId } });
    if (!record) return Response.json({ error: "Record not found" }, { status: 404 });

    const visit = record.visit as { maternity?: { visits?: unknown[]; [key: string]: unknown }; [key: string]: unknown };
    if (!visit.maternity) return Response.json({ error: "Not a maternity patient" }, { status: 400 });

    const visits = visit.maternity.visits || [];
    visits.push({
      id: `MAT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date: new Date().toISOString(),
      type: type || "antenatal_checkup",
      notes,
      recordedBy: recordedBy || "midwife",
    });
    visit.maternity.visits = visits;

    await db.patientRecord.update({ where: { id: recordId }, data: { visit: JSON.parse(JSON.stringify(visit)) } });

    // Emit billable item
    const now = new Date();
    const book = await db.monthlyBook.findFirst({ where: { hospitalId: hospital.id, year: now.getFullYear(), month: now.getMonth() + 1, status: "active" } });
    if (book) {
      await createBillableItem({ hospitalId: hospital.id, patientId: recordId, bookId: book.id, serviceType: "CONSULTATION", description: `Maternity: ${type || "Antenatal Visit"}`, unitCost: 30, renderedBy: recordedBy || "midwife" });
    }

    return Response.json({ success: true, visitsCount: visits.length });
  }

  // Record delivery
  if (action === "delivery") {
    const { recordId, deliveryMode, babyWeight, babyGender, apgarScores, complications, recordedBy } = body;
    if (!recordId || !deliveryMode) return Response.json({ error: "recordId and deliveryMode required" }, { status: 400 });

    const record = await db.patientRecord.findUnique({ where: { id: recordId } });
    if (!record) return Response.json({ error: "Record not found" }, { status: 404 });

    const visit = record.visit as { maternity?: { [key: string]: unknown }; [key: string]: unknown };
    if (!visit.maternity) return Response.json({ error: "Not a maternity patient" }, { status: 400 });

    visit.maternity.stage = "postnatal";
    visit.maternity.deliveredAt = new Date().toISOString();
    visit.maternity.deliveryMode = deliveryMode;
    visit.maternity.babyWeight = babyWeight || null;
    visit.maternity.babyGender = babyGender || null;
    visit.maternity.apgarScores = apgarScores || null;
    visit.maternity.complications = complications || null;

    await db.patientRecord.update({ where: { id: recordId }, data: { visit: JSON.parse(JSON.stringify(visit)) } });

    // Emit PROCEDURE billable
    const now = new Date();
    const book = await db.monthlyBook.findFirst({ where: { hospitalId: hospital.id, year: now.getFullYear(), month: now.getMonth() + 1, status: "active" } });
    if (book) {
      const cost = deliveryMode === "caesarean" ? 800 : deliveryMode === "assisted" ? 400 : 200;
      await createBillableItem({ hospitalId: hospital.id, patientId: recordId, bookId: book.id, serviceType: "PROCEDURE", description: `Delivery: ${deliveryMode}`, unitCost: cost, renderedBy: recordedBy || "midwife" });
    }

    await logAudit({ actorType: "device_operator", actorId: recordedBy || "midwife", hospitalId: hospital.id, action: "maternity.delivery", metadata: { recordId, deliveryMode, babyGender, babyWeight }, ipAddress: getClientIP(request) });

    return Response.json({ success: true });
  }

  // Discharge
  if (action === "discharge") {
    const { recordId, dischargedBy } = body;
    if (!recordId) return Response.json({ error: "recordId required" }, { status: 400 });

    const record = await db.patientRecord.findUnique({ where: { id: recordId } });
    if (!record) return Response.json({ error: "Record not found" }, { status: 404 });

    const visit = record.visit as { maternity?: { [key: string]: unknown }; [key: string]: unknown };
    if (!visit.maternity) return Response.json({ error: "Not a maternity patient" }, { status: 400 });

    visit.maternity.stage = "discharged";
    visit.maternity.dischargedAt = new Date().toISOString();

    await db.patientRecord.update({ where: { id: recordId }, data: { visit: JSON.parse(JSON.stringify(visit)) } });

    return Response.json({ success: true });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}
