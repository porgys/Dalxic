import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { createBillableItem } from "@/lib/billing";
import { rateLimit } from "@/lib/rate-limit";
// Blood inventory is stored in hospital-level JSON since we have no dedicated table
// Donation records use PatientRecord with entryPoint "blood_donation"

// GET: Get blood inventory, transfusion requests, or donor records
export async function GET(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;  const { searchParams } = new URL(request.url);
  const hospitalCode = searchParams.get("hospitalCode");
  const view = searchParams.get("view"); // inventory | requests | history | donors

  if (!hospitalCode) return Response.json({ error: "hospitalCode required" }, { status: 400 });

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Return donor records
  if (view === "donors") {
    const donorRecords = await db.patientRecord.findMany({
      where: { hospitalId: hospital.id, entryPoint: "blood_donation" },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    const donors = donorRecords.map((r) => {
      const donor = r.patient as Record<string, unknown>;
      const visit = r.visit as Record<string, unknown>;
      return { id: r.id, ...donor, ...visit, createdAt: r.createdAt };
    });
    return Response.json({ donors });
  }

  // Get all patient records that have transfusion data
  const records = await db.patientRecord.findMany({
    where: { hospitalId: hospital.id, entryPoint: { not: "blood_donation" } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  type TransfusionRequest = {
    id: string;
    bloodGroup: string;
    component: string;
    units: number;
    urgency: string;
    status: string;
    requestedBy: string;
    requestedAt: string;
    crossMatchedBy?: string;
    crossMatchedAt?: string;
    issuedBy?: string;
    issuedAt?: string;
    notes?: string;
  };

  const requests = records.flatMap((r) => {
    const treatment = r.treatment as { transfusionRequests?: TransfusionRequest[] };
    const patient = r.patient as { fullName: string };
    const visit = r.visit as { queueToken: string };
    if (!treatment.transfusionRequests?.length) return [];
    return treatment.transfusionRequests.map((tr) => ({
      ...tr,
      recordId: r.id,
      patientName: patient.fullName,
      queueToken: visit.queueToken,
    }));
  });

  const counts = {
    pendingRequests: requests.filter((r) => r.status === "pending").length,
    crossMatched: requests.filter((r) => r.status === "cross_matched").length,
    issued: requests.filter((r) => r.status === "issued").length,
    totalRequests: requests.length,
  };

  if (view === "requests") {
    return Response.json({ requests: requests.filter((r) => r.status !== "issued"), counts });
  }

  if (view === "history") {
    return Response.json({ requests: requests.filter((r) => r.status === "issued"), counts });
  }

  // Default: inventory from BloodInventory table
  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const invRows = await db.bloodInventory.findMany({ where: { hospitalId: hospital.id } });
  const invMap = new Map(invRows.map((r) => [`${r.bloodType}:${r.component}`, r.units]));

  const inventory = bloodGroups.map((bg) => ({
    bloodGroup: bg,
    wholeBlood: invMap.get(`${bg}:whole_blood`) ?? 0,
    packedRBC: invMap.get(`${bg}:packed_rbc`) ?? 0,
    platelets: invMap.get(`${bg}:platelets`) ?? 0,
    ffp: invMap.get(`${bg}:ffp`) ?? 0,
  }));

  return Response.json({ inventory, requests, counts });
}

// POST: Request transfusion, cross-match, issue blood
export async function POST(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;  const body = await request.json();
  const { hospitalCode, action } = body;

  if (!hospitalCode || !action) return Response.json({ error: "hospitalCode and action required" }, { status: 400 });

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  // Request blood for patient
  if (action === "request") {
    const { recordId, bloodGroup, component, units, urgency, requestedBy, notes } = body;
    if (!recordId || !bloodGroup || !component) return Response.json({ error: "recordId, bloodGroup, component required" }, { status: 400 });

    const record = await db.patientRecord.findUnique({ where: { id: recordId } });
    if (!record) return Response.json({ error: "Record not found" }, { status: 404 });

    const treatment = record.treatment as { transfusionRequests?: unknown[]; [key: string]: unknown };
    const requests = treatment.transfusionRequests || [];
    const newReq = {
      id: `TRF-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      bloodGroup,
      component, // whole_blood | packed_rbc | platelets | ffp
      units: units || 1,
      urgency: urgency || "routine",
      status: "pending",
      requestedBy: requestedBy || "doctor",
      requestedAt: new Date().toISOString(),
      notes: notes || null,
    };
    requests.push(newReq);

    await db.patientRecord.update({ where: { id: recordId }, data: { treatment: JSON.parse(JSON.stringify({ ...treatment, transfusionRequests: requests })) } });

    await logAudit({ actorType: "device_operator", actorId: requestedBy || "doctor", hospitalId: hospital.id, action: "blood_bank.requested", metadata: { recordId, bloodGroup, component, units }, ipAddress: getClientIP(request) });

    return Response.json(newReq, { status: 201 });
  }

  // Cross-match
  if (action === "cross_match") {
    const { recordId, requestId, crossMatchedBy } = body;
    if (!recordId || !requestId) return Response.json({ error: "recordId and requestId required" }, { status: 400 });

    const record = await db.patientRecord.findUnique({ where: { id: recordId } });
    if (!record) return Response.json({ error: "Record not found" }, { status: 404 });

    const treatment = record.treatment as { transfusionRequests?: Array<{ id: string; status: string; crossMatchedBy?: string; crossMatchedAt?: string }>; [key: string]: unknown };
    const requests = treatment.transfusionRequests || [];
    const idx = requests.findIndex((r) => r.id === requestId);
    if (idx === -1) return Response.json({ error: "Request not found" }, { status: 404 });

    requests[idx].status = "cross_matched";
    requests[idx].crossMatchedBy = crossMatchedBy || "blood_bank_officer";
    requests[idx].crossMatchedAt = new Date().toISOString();

    await db.patientRecord.update({ where: { id: recordId }, data: { treatment: JSON.parse(JSON.stringify({ ...treatment, transfusionRequests: requests })) } });

    return Response.json({ success: true });
  }

  // Issue blood
  if (action === "issue") {
    const { recordId, requestId, issuedBy } = body;
    if (!recordId || !requestId) return Response.json({ error: "recordId and requestId required" }, { status: 400 });

    const record = await db.patientRecord.findUnique({ where: { id: recordId } });
    if (!record) return Response.json({ error: "Record not found" }, { status: 404 });

    const treatment = record.treatment as { transfusionRequests?: Array<{ id: string; status: string; component: string; bloodGroup: string; units: number; issuedBy?: string; issuedAt?: string }>; [key: string]: unknown };
    const requests = treatment.transfusionRequests || [];
    const idx = requests.findIndex((r) => r.id === requestId);
    if (idx === -1) return Response.json({ error: "Request not found" }, { status: 404 });

    requests[idx].status = "issued";
    requests[idx].issuedBy = issuedBy || "blood_bank_officer";
    requests[idx].issuedAt = new Date().toISOString();

    await db.patientRecord.update({ where: { id: recordId }, data: { treatment: JSON.parse(JSON.stringify({ ...treatment, transfusionRequests: requests })) } });

    // Emit billable item
    const now = new Date();
    const book = await db.monthlyBook.findFirst({ where: { hospitalId: hospital.id, year: now.getFullYear(), month: now.getMonth() + 1, status: "active" } });
    if (book) {
      await createBillableItem({ hospitalId: hospital.id, patientId: recordId, bookId: book.id, serviceType: "PROCEDURE", description: `Blood: ${requests[idx].component} (${requests[idx].bloodGroup}) x${requests[idx].units}`, unitCost: 150, quantity: requests[idx].units, renderedBy: issuedBy || "blood_bank_officer" });
    }

    // Decrement inventory
    const compMap: Record<string, string> = { whole_blood: "whole_blood", packed_rbc: "packed_rbc", platelets: "platelets", ffp: "ffp" };
    const comp = compMap[requests[idx].component] || requests[idx].component;
    await db.bloodInventory.upsert({
      where: { hospitalId_bloodType_component: { hospitalId: hospital.id, bloodType: requests[idx].bloodGroup, component: comp } },
      update: { units: { decrement: requests[idx].units } },
      create: { hospitalId: hospital.id, bloodType: requests[idx].bloodGroup, component: comp, units: 0 },
    });

    await logAudit({ actorType: "device_operator", actorId: issuedBy || "blood_bank_officer", hospitalId: hospital.id, action: "blood_bank.issued", metadata: { recordId, requestId, component: requests[idx].component, bloodGroup: requests[idx].bloodGroup }, ipAddress: getClientIP(request) });

    return Response.json({ success: true });
  }

  // Receive / donate blood (external supply, not walk-in donor)
  if (action === "receive") {
    const { bloodGroup, component, units, receivedBy } = body;
    if (!bloodGroup || !component || !units) return Response.json({ error: "bloodGroup, component, units required" }, { status: 400 });

    await db.bloodInventory.upsert({
      where: { hospitalId_bloodType_component: { hospitalId: hospital.id, bloodType: bloodGroup, component } },
      update: { units: { increment: units } },
      create: { hospitalId: hospital.id, bloodType: bloodGroup, component, units },
    });

    await logAudit({ actorType: "device_operator", actorId: receivedBy || "blood_bank_officer", hospitalId: hospital.id, action: "blood_bank.received", metadata: { bloodGroup, component, units }, ipAddress: getClientIP(request) });

    return Response.json({ success: true });
  }

  // ─── Walk-In Donor Flow ───

  // Step 1: Register walk-in donor
  if (action === "register_donor") {
    const { donorName, phone, dateOfBirth, gender, bloodGroup, registeredBy } = body;
    if (!donorName) return Response.json({ error: "donorName required" }, { status: 400 });

    // Generate donor token: DN-KBH-001
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const donorCount = await db.patientRecord.count({
      where: { hospitalId: hospital.id, entryPoint: "blood_donation", createdAt: { gte: today } },
    });
    const donorToken = `BD-${hospitalCode}-${String(donorCount + 1).padStart(3, "0")}`;

    // Find or create active book
    const now = new Date();
    let book = await db.monthlyBook.findUnique({
      where: { hospitalId_year_month: { hospitalId: hospital.id, year: now.getFullYear(), month: now.getMonth() + 1 } },
    });
    if (!book) {
      book = await db.monthlyBook.create({
        data: { hospitalId: hospital.id, year: now.getFullYear(), month: now.getMonth() + 1, status: "active" },
      });
    }

    const record = await db.patientRecord.create({
      data: {
        bookId: book.id,
        hospitalId: hospital.id,
        patient: JSON.parse(JSON.stringify({
          fullName: donorName,
          phone: phone || null,
          dateOfBirth: dateOfBirth || null,
          gender: gender || null,
          bloodGroup: bloodGroup || null,
        })),
        visit: JSON.parse(JSON.stringify({
          donorToken,
          donorStatus: "registered", // registered → screened → collected → deferred
          registeredAt: now.toISOString(),
          registeredBy: registeredBy || "blood_bank_officer",
          screening: null,
          collection: null,
        })),
        diagnosis: JSON.parse(JSON.stringify({})),
        treatment: JSON.parse(JSON.stringify({})),
        entryPoint: "blood_donation",
        createdBy: registeredBy || "blood_bank_officer",
      },
    });

    await logAudit({ actorType: "device_operator", actorId: registeredBy || "blood_bank_officer", hospitalId: hospital.id, action: "blood_bank.donor_registered", metadata: { donorToken, donorName }, ipAddress: getClientIP(request) });

    return Response.json({ donorToken, recordId: record.id }, { status: 201 });
  }

  // Step 2: Screen donor (vitals + eligibility)
  if (action === "screen_donor") {
    const { recordId, weight, bloodPressure, hemoglobin, pulse, temperature, eligible, deferralReason, screenedBy } = body;
    if (!recordId) return Response.json({ error: "recordId required" }, { status: 400 });

    const record = await db.patientRecord.findUnique({ where: { id: recordId } });
    if (!record || record.entryPoint !== "blood_donation") return Response.json({ error: "Donor record not found" }, { status: 404 });

    const visit = record.visit as Record<string, unknown>;
    const screening = {
      weight: weight || null,
      bloodPressure: bloodPressure || null,
      hemoglobin: hemoglobin || null,
      pulse: pulse || null,
      temperature: temperature || null,
      eligible: eligible !== false, // default true
      deferralReason: eligible === false ? (deferralReason || "Not eligible") : null,
      screenedBy: screenedBy || "blood_bank_nurse",
      screenedAt: new Date().toISOString(),
    };

    const newStatus = eligible === false ? "deferred" : "screened";

    await db.patientRecord.update({
      where: { id: recordId },
      data: { visit: JSON.parse(JSON.stringify({ ...visit, donorStatus: newStatus, screening })) },
    });

    await logAudit({ actorType: "device_operator", actorId: screenedBy || "blood_bank_nurse", hospitalId: hospital.id, action: `blood_bank.donor_${newStatus}`, metadata: { recordId, eligible, hemoglobin }, ipAddress: getClientIP(request) });

    return Response.json({ success: true, status: newStatus });
  }

  // Step 3: Collect donation (blood typed, bags collected, inventory updated)
  if (action === "collect_donation") {
    const { recordId, bloodGroup, component, units, collectedBy } = body;
    if (!recordId || !bloodGroup) return Response.json({ error: "recordId and bloodGroup required" }, { status: 400 });

    const record = await db.patientRecord.findUnique({ where: { id: recordId } });
    if (!record || record.entryPoint !== "blood_donation") return Response.json({ error: "Donor record not found" }, { status: 404 });

    const visit = record.visit as Record<string, unknown>;
    if (visit.donorStatus !== "screened") return Response.json({ error: "Donor must be screened before collection" }, { status: 409 });

    const comp = component || "whole_blood";
    const qty = units || 1;
    const collection = {
      bloodGroup,
      component: comp,
      units: qty,
      collectedBy: collectedBy || "blood_bank_officer",
      collectedAt: new Date().toISOString(),
    };

    // Update donor record
    const patient = record.patient as Record<string, unknown>;
    await db.patientRecord.update({
      where: { id: recordId },
      data: {
        patient: JSON.parse(JSON.stringify({ ...patient, bloodGroup })),
        visit: JSON.parse(JSON.stringify({ ...visit, donorStatus: "collected", collection })),
      },
    });

    // Increment inventory
    await db.bloodInventory.upsert({
      where: { hospitalId_bloodType_component: { hospitalId: hospital.id, bloodType: bloodGroup, component: comp } },
      update: { units: { increment: qty } },
      create: { hospitalId: hospital.id, bloodType: bloodGroup, component: comp, units: qty },
    });

    await logAudit({ actorType: "device_operator", actorId: collectedBy || "blood_bank_officer", hospitalId: hospital.id, action: "blood_bank.donation_collected", metadata: { recordId, bloodGroup, component: comp, units: qty }, ipAddress: getClientIP(request) });

    return Response.json({ success: true, bloodGroup, component: comp, units: qty });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}
