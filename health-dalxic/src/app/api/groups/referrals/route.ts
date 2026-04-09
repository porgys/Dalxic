import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { getPusher, hospitalChannel } from "@/lib/pusher-server";
import { rateLimit } from "@/lib/rate-limit";

// Inter-branch referrals stored in a dedicated JSON structure on PatientRecord.visit
// visit.interBranchReferrals[] — array of referral objects

// GET: Fetch inter-branch referrals for a group or specific hospital
export async function GET(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;
  const { searchParams } = new URL(request.url);
  const groupCode = searchParams.get("groupCode");
  const hospitalCode = searchParams.get("hospitalCode"); // filter by receiving branch
  const status = searchParams.get("status"); // PENDING | ACCEPTED | COMPLETED | all

  if (!groupCode) return Response.json({ error: "groupCode required" }, { status: 400 });

  const group = await db.hospitalGroup.findUnique({ where: { groupCode } });
  if (!group) return Response.json({ error: "Group not found" }, { status: 404 });

  // Get all hospitals in group
  const groupHospitals = await db.hospital.findMany({
    where: { groupCode, active: true },
    select: { id: true, code: true, name: true },
  });
  const hospitalIds = groupHospitals.map(h => h.id);
  const hospitalMap = Object.fromEntries(groupHospitals.map(h => [h.id, h]));

  // Get today's records across all group hospitals
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const records = await db.patientRecord.findMany({
    where: {
      hospitalId: { in: hospitalIds },
      createdAt: { gte: today },
    },
    select: { id: true, hospitalId: true, patient: true, visit: true },
  });

  // Extract inter-branch referrals from visit JSON
  const referrals: Array<Record<string, unknown>> = [];
  for (const record of records) {
    const visit = record.visit as Record<string, unknown>;
    const ibReferrals = (visit?.interBranchReferrals || []) as Array<Record<string, unknown>>;
    const patient = record.patient as Record<string, unknown>;

    for (const ref of ibReferrals) {
      // Filter by receiving hospital if specified
      if (hospitalCode && ref.toHospitalCode !== hospitalCode) continue;
      // Filter by status
      if (status && status !== "all" && ref.status !== status) continue;

      referrals.push({
        ...ref,
        patientRecordId: record.id,
        patientName: patient?.fullName || "Unknown",
        fromHospitalName: hospitalMap[record.hospitalId]?.name || "Unknown",
      });
    }
  }

  // Sort: CRITICAL first, then URGENT, then by time
  const priorityOrder: Record<string, number> = { CRITICAL: 0, URGENT: 1, ROUTINE: 2 };
  referrals.sort((a, b) => {
    const pa = priorityOrder[String(a.priority)] ?? 2;
    const pb = priorityOrder[String(b.priority)] ?? 2;
    if (pa !== pb) return pa - pb;
    return new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime();
  });

  return Response.json({
    referrals,
    groupCode,
    groupName: group.name,
    counts: {
      pending: referrals.filter(r => r.status === "PENDING").length,
      accepted: referrals.filter(r => r.status === "ACCEPTED").length,
      completed: referrals.filter(r => r.status === "COMPLETED").length,
      total: referrals.length,
    },
  });
}

// POST: Create, accept, reject, complete inter-branch referrals
export async function POST(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;
  const body = await request.json();
  const { action, groupCode, hospitalCode } = body;

  if (!action || !groupCode || !hospitalCode) {
    return Response.json({ error: "action, groupCode, hospitalCode required" }, { status: 400 });
  }

  // Verify group
  const group = await db.hospitalGroup.findUnique({ where: { groupCode } });
  if (!group) return Response.json({ error: "Group not found" }, { status: 404 });

  // Verify hospital belongs to group
  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital || hospital.groupCode !== groupCode) {
    return Response.json({ error: "Hospital not in this group" }, { status: 403 });
  }

  // ── Create inter-branch referral ──
  if (action === "create") {
    const {
      recordId, toHospitalCode, department, referralType,
      priority, clinicalReason, referringDoctorName, notes,
    } = body;

    if (!recordId || !toHospitalCode || !department || !clinicalReason || !referringDoctorName) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify destination hospital is in same group
    const destHospital = await db.hospital.findUnique({ where: { code: toHospitalCode } });
    if (!destHospital || destHospital.groupCode !== groupCode) {
      return Response.json({ error: "Destination hospital not in this group" }, { status: 403 });
    }

    // Verify destination has the required module
    const moduleMap: Record<string, string> = {
      "CT/Radiology": "ct_radiology", "Radiology": "ct_radiology",
      "Ultrasound": "ultrasound", "Lab": "lab", "Laboratory": "lab",
      "ICU": "icu", "Maternity": "maternity", "Blood Bank": "blood_bank",
      "Ward": "ward_ipd", "Pharmacy": "pharmacy", "Emergency": "emergency",
    };
    const requiredModule = moduleMap[department];
    if (requiredModule && !destHospital.activeModules.includes(requiredModule)) {
      return Response.json({
        error: `${destHospital.name} does not have the ${department} module active`,
      }, { status: 400 });
    }

    // Load patient record
    const record = await db.patientRecord.findUnique({ where: { id: recordId } });
    if (!record) return Response.json({ error: "Patient record not found" }, { status: 404 });

    const visit = record.visit as Record<string, unknown>;
    const existingReferrals = (visit.interBranchReferrals || []) as Array<Record<string, unknown>>;

    const effectivePriority = priority || "ROUTINE";
    const effectiveType = referralType || "OUTPATIENT";

    // CRITICAL referrals skip PENDING — go straight to ACCEPTED
    const initialStatus = effectivePriority === "CRITICAL" ? "ACCEPTED" : "PENDING";

    const newReferral = {
      id: `IBR-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      groupCode,
      fromHospitalCode: hospitalCode,
      fromHospitalName: hospital.name,
      toHospitalCode,
      toHospitalName: destHospital.name,
      referralType: effectiveType,
      department,
      clinicalReason,
      priority: effectivePriority,
      referringDoctorName,
      status: initialStatus,
      acceptedBy: effectivePriority === "CRITICAL" ? "AUTO-CRITICAL" : null,
      rejectedReason: null,
      completedAt: null,
      notes: notes || null,
      createdAt: new Date().toISOString(),
    };

    // Save to patient record
    await db.patientRecord.update({
      where: { id: recordId },
      data: {
        visit: JSON.parse(JSON.stringify({
          ...visit,
          interBranchReferrals: [...existingReferrals, newReferral],
        })),
      },
    });

    // Pusher: notify receiving branch
    try {
      const pusher = getPusher();
      const event = effectivePriority === "CRITICAL" ? "emergency:inter-branch" : "new-inter-branch-referral";
      await pusher.trigger(hospitalChannel(toHospitalCode, "referrals"), event, {
        referralId: newReferral.id,
        fromBranch: hospital.name,
        department,
        priority: effectivePriority,
        patientName: (record.patient as Record<string, unknown>)?.fullName || "Unknown",
      });

      // Also notify group channel
      await pusher.trigger(`private-group-${groupCode}`, "referral:new", {
        referralId: newReferral.id,
        from: hospitalCode,
        to: toHospitalCode,
        priority: effectivePriority,
      });
    } catch { /* Pusher not configured yet */ }

    await logAudit({
      actorType: "device_operator",
      actorId: referringDoctorName,
      hospitalId: hospital.id,
      action: effectivePriority === "CRITICAL" ? "referral.inter_branch_critical" : "referral.inter_branch_created",
      metadata: { referralId: newReferral.id, to: toHospitalCode, department, priority: effectivePriority },
      ipAddress: getClientIP(request),
    });

    return Response.json({ success: true, referral: newReferral }, { status: 201 });
  }

  // ── Accept referral ──
  if (action === "accept") {
    return updateReferralStatus(body, "ACCEPTED", request);
  }

  // ── Reject referral ──
  if (action === "reject") {
    return updateReferralStatus(body, "REJECTED", request);
  }

  // ── Complete referral ──
  if (action === "complete") {
    return updateReferralStatus(body, "COMPLETED", request);
  }

  return Response.json({ error: "Invalid action. Use: create, accept, reject, complete" }, { status: 400 });
}

// Shared helper to update referral status inside visit JSON
async function updateReferralStatus(
  body: Record<string, unknown>,
  newStatus: string,
  request: Request,
) {
  const { recordId, referralId, operatorName, rejectedReason } = body as Record<string, string>;

  if (!recordId || !referralId) {
    return Response.json({ error: "recordId and referralId required" }, { status: 400 });
  }

  const record = await db.patientRecord.findUnique({ where: { id: recordId } });
  if (!record) return Response.json({ error: "Record not found" }, { status: 404 });

  const visit = record.visit as Record<string, unknown>;
  const referrals = (visit.interBranchReferrals || []) as Array<Record<string, unknown>>;

  const idx = referrals.findIndex(r => r.id === referralId);
  if (idx === -1) return Response.json({ error: "Referral not found" }, { status: 404 });

  const referral = referrals[idx];
  referral.status = newStatus;

  if (newStatus === "ACCEPTED") {
    referral.acceptedBy = operatorName || "operator";
  }
  if (newStatus === "REJECTED") {
    referral.rejectedReason = rejectedReason || "No reason provided";
  }
  if (newStatus === "COMPLETED") {
    referral.completedAt = new Date().toISOString();
  }

  referrals[idx] = referral;

  await db.patientRecord.update({
    where: { id: recordId },
    data: {
      visit: JSON.parse(JSON.stringify({ ...visit, interBranchReferrals: referrals })),
    },
  });

  // Pusher: notify originating branch
  try {
    const pusher = getPusher();
    const fromCode = String(referral.fromHospitalCode);
    await pusher.trigger(hospitalChannel(fromCode, "referrals"), `referral:${newStatus.toLowerCase()}`, {
      referralId,
      status: newStatus,
      updatedBy: operatorName || "operator",
    });
  } catch { /* Pusher not configured */ }

  await logAudit({
    actorType: "device_operator",
    actorId: operatorName || "operator",
    hospitalId: record.hospitalId,
    action: `referral.inter_branch_${newStatus.toLowerCase()}`,
    metadata: { referralId, newStatus },
    ipAddress: getClientIP(request),
  });

  return Response.json({ success: true, referral });
}
