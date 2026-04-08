import { db } from "@/lib/db";
import { generateLabToken, generateReferralToken } from "@/lib/tokens";
import { logAudit, getClientIP } from "@/lib/audit";
import { getPusher, hospitalChannel } from "@/lib/pusher-server";

type StationReferralType = "lab" | "injection" | "radiology" | "ct" | "ultrasound";

const STATION_MAP: Record<StationReferralType, { prefix: string; channel: string; role: string }> = {
  lab: { prefix: "LAB", channel: "lab", role: "lab" },
  injection: { prefix: "INJ", channel: "injection", role: "injection" },
  radiology: { prefix: "RAD", channel: "radiology", role: "radiology" },
  ct: { prefix: "CT", channel: "radiology", role: "radiology" },
  ultrasound: { prefix: "US", channel: "ultrasound", role: "ultrasound" },
};

// Specialist types for doctor-to-doctor referrals
const SPECIALIST_TYPES = [
  "general_practitioner", "cardiologist", "neurologist", "orthopedic", "dermatologist",
  "pediatrician", "gynecologist", "surgeon", "ophthalmologist", "ent_specialist",
  "psychiatrist", "urologist", "oncologist", "pulmonologist", "endocrinologist",
];

type DoctorReferral = {
  id: string;
  targetStation: string;
  targetDoctor?: string | null;
  specialty?: string | null;
  reason: string;
  urgency: string;
  referredBy: string;
  referredAt: string;
  notes?: string | null;
  status: string;
  acceptedBy?: string | null;
  acceptedAt?: string | null;
  completedAt?: string | null;
  completionNotes?: string | null;
  chainedFrom?: string | null;
};

// GET: Fetch referrals — supports both station referrals and doctor-to-doctor
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hospitalCode = searchParams.get("hospitalCode");
  const targetStation = searchParams.get("targetStation"); // "doctor", "lab", "radiology", etc.
  const specialty = searchParams.get("specialty"); // filter by specialist type
  const status = searchParams.get("status"); // pending | accepted | completed | all

  if (!hospitalCode) return Response.json({ error: "hospitalCode required" }, { status: 400 });

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const records = await db.patientRecord.findMany({
    where: { hospitalId: hospital.id, createdAt: { gte: today } },
    orderBy: { createdAt: "desc" },
  });

  const allReferrals = records.flatMap((r) => {
    const visit = r.visit as { referrals?: DoctorReferral[]; queueToken?: string; department?: string; chiefComplaint?: string };
    const patient = r.patient as { fullName: string };
    const diagnosis = r.diagnosis as { primary?: string; notes?: string };
    if (!visit.referrals?.length) return [];
    return visit.referrals.map((ref) => ({
      ...ref,
      recordId: r.id,
      patientName: patient.fullName,
      queueToken: visit.queueToken ?? "—",
      originalDepartment: visit.department ?? "",
      chiefComplaint: visit.chiefComplaint ?? "",
      currentDiagnosis: diagnosis.primary ?? null,
    }));
  });

  let filtered = allReferrals;
  if (targetStation) filtered = filtered.filter((r) => r.targetStation === targetStation);
  if (specialty) filtered = filtered.filter((r) => r.specialty === specialty);
  if (status && status !== "all") filtered = filtered.filter((r) => r.status === status);

  // Sort: urgent first, then by time
  filtered.sort((a, b) => {
    const urgencyOrder: Record<string, number> = { stat: 0, urgent: 1, routine: 2 };
    const ua = urgencyOrder[a.urgency] ?? 2;
    const ub = urgencyOrder[b.urgency] ?? 2;
    if (ua !== ub) return ua - ub;
    return new Date(b.referredAt).getTime() - new Date(a.referredAt).getTime();
  });

  const counts = {
    pending: allReferrals.filter((r) => r.status === "pending" && (!targetStation || r.targetStation === targetStation)).length,
    accepted: allReferrals.filter((r) => r.status === "accepted" && (!targetStation || r.targetStation === targetStation)).length,
    completed: allReferrals.filter((r) => r.status === "completed" && (!targetStation || r.targetStation === targetStation)).length,
    total: filtered.length,
  };

  return Response.json({ referrals: filtered, counts, specialistTypes: SPECIALIST_TYPES });
}

// POST: Create referrals — station referrals, doctor-to-doctor, accept, complete, chain
export async function POST(request: Request) {
  const body = await request.json();
  const { hospitalCode, action } = body;

  if (!hospitalCode) return Response.json({ error: "hospitalCode required" }, { status: 400 });

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  // ─── Station referral (lab, injection, imaging) — original flow ───
  if (action === "station_refer" || (!action && body.referralType)) {
    const { patientRecordId, referralType, details, referredBy } = body as {
      patientRecordId: string;
      referralType: StationReferralType;
      details: Record<string, unknown>;
      referredBy: string;
    };

    if (!patientRecordId || !referralType || !referredBy) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const station = STATION_MAP[referralType];
    if (!station) return Response.json({ error: "Invalid referral type" }, { status: 400 });

    const record = await db.patientRecord.findUnique({ where: { id: patientRecordId } });
    if (!record) return Response.json({ error: "Patient record not found" }, { status: 404 });

    let token: string;
    if (referralType === "lab") {
      token = await generateLabToken(hospitalCode);
    } else {
      token = await generateReferralToken(hospitalCode, station.prefix);
    }

    if (referralType === "lab" && details.tests) {
      await db.labOrder.create({
        data: {
          patientId: patientRecordId,
          hospitalId: hospital.id,
          bookId: record.bookId,
          orderedBy: referredBy,
          tests: JSON.parse(JSON.stringify(details.tests)),
          customTests: (details.customTests as string) ?? null,
          clinicalNotes: (details.clinicalNotes as string) ?? null,
          labToken: token,
        },
      });
    }

    try {
      const pusher = getPusher();
      const patient = record.patient as { fullName?: string };
      await pusher.trigger(hospitalChannel(hospitalCode, station.channel), "new-referral", {
        token, referralType, patientName: patient.fullName ?? "Unknown", patientRecordId, details,
      });
    } catch { /* Pusher not configured */ }

    await logAudit({
      actorType: "device_operator", actorId: referredBy, hospitalId: hospital.id,
      action: "referral.station_created", metadata: { token, referralType, patientRecordId },
      ipAddress: getClientIP(request),
    });

    return Response.json({ token, referralType, station: station.role }, { status: 201 });
  }

  // ─── Doctor-to-doctor referral (daisy-chain) ───
  if (action === "refer") {
    const { recordId, targetStation, targetDoctor, specialty, reason, urgency, referredBy, notes } = body;
    if (!recordId || !reason) return Response.json({ error: "recordId and reason required" }, { status: 400 });

    const record = await db.patientRecord.findUnique({ where: { id: recordId } });
    if (!record) return Response.json({ error: "Record not found" }, { status: 404 });

    const visit = record.visit as Record<string, unknown>;
    const referrals = (visit.referrals as DoctorReferral[]) || [];

    const newRef: DoctorReferral = {
      id: `REF-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      targetStation: targetStation || "doctor",
      targetDoctor: targetDoctor || null,
      specialty: specialty || null,
      reason,
      urgency: urgency || "routine",
      referredBy: referredBy || "doctor",
      referredAt: new Date().toISOString(),
      notes: notes || null,
      status: "pending",
    };

    referrals.push(newRef);
    visit.referrals = referrals;

    await db.patientRecord.update({
      where: { id: recordId },
      data: { visit: JSON.parse(JSON.stringify(visit)) },
    });

    try {
      const pusher = getPusher();
      const patient = record.patient as { fullName?: string };
      await pusher.trigger(hospitalChannel(hospitalCode, "referrals"), "new-referral", {
        ...newRef, recordId, patientName: patient.fullName ?? "Unknown",
        queueToken: (visit.queueToken as string) ?? "—",
      });
    } catch { /* Pusher not configured */ }

    await logAudit({
      actorType: "doctor", actorId: referredBy || "doctor", hospitalId: hospital.id,
      action: "referral.doctor_created", metadata: { recordId, targetStation, specialty, urgency },
      ipAddress: getClientIP(request),
    });

    return Response.json(newRef, { status: 201 });
  }

  // ─── Accept a referral ───
  if (action === "accept") {
    const { recordId, referralId, acceptedBy } = body;
    if (!recordId || !referralId) return Response.json({ error: "recordId and referralId required" }, { status: 400 });

    const record = await db.patientRecord.findUnique({ where: { id: recordId } });
    if (!record) return Response.json({ error: "Record not found" }, { status: 404 });

    const visit = record.visit as { referrals?: DoctorReferral[]; [key: string]: unknown };
    const referrals = visit.referrals || [];
    const idx = referrals.findIndex((r) => r.id === referralId);
    if (idx === -1) return Response.json({ error: "Referral not found" }, { status: 404 });

    referrals[idx].status = "accepted";
    referrals[idx].acceptedBy = acceptedBy || "doctor";
    referrals[idx].acceptedAt = new Date().toISOString();

    await db.patientRecord.update({
      where: { id: recordId },
      data: { visit: JSON.parse(JSON.stringify(visit)) },
    });

    return Response.json({ success: true });
  }

  // ─── Complete a referral (with optional daisy-chain to next specialist) ───
  if (action === "complete") {
    const { recordId, referralId, completedBy, completionNotes, chainTo } = body as {
      recordId: string;
      referralId: string;
      completedBy?: string;
      completionNotes?: string;
      chainTo?: { targetStation: string; specialty?: string; targetDoctor?: string; reason: string; urgency?: string; notes?: string };
    };
    if (!recordId || !referralId) return Response.json({ error: "recordId and referralId required" }, { status: 400 });

    const record = await db.patientRecord.findUnique({ where: { id: recordId } });
    if (!record) return Response.json({ error: "Record not found" }, { status: 404 });

    const visit = record.visit as { referrals?: DoctorReferral[]; [key: string]: unknown };
    const referrals = visit.referrals || [];
    const idx = referrals.findIndex((r) => r.id === referralId);
    if (idx === -1) return Response.json({ error: "Referral not found" }, { status: 404 });

    referrals[idx].status = "completed";
    referrals[idx].completedAt = new Date().toISOString();
    referrals[idx].completionNotes = completionNotes || null;

    // Daisy-chain: auto-create the next referral in the chain
    let chainedRef: DoctorReferral | null = null;
    if (chainTo) {
      chainedRef = {
        id: `REF-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        targetStation: chainTo.targetStation || "doctor",
        specialty: chainTo.specialty || null,
        targetDoctor: chainTo.targetDoctor || null,
        reason: chainTo.reason || "Referred onward from specialist",
        urgency: chainTo.urgency || "routine",
        referredBy: completedBy || "doctor",
        referredAt: new Date().toISOString(),
        notes: chainTo.notes || null,
        status: "pending",
        chainedFrom: referralId,
      };
      referrals.push(chainedRef);

      try {
        const pusher = getPusher();
        const patient = record.patient as { fullName?: string };
        await pusher.trigger(hospitalChannel(hospitalCode, "referrals"), "new-referral", {
          ...chainedRef, recordId, patientName: patient.fullName ?? "Unknown",
          queueToken: (visit.queueToken as string) ?? "—",
        });
      } catch { /* Pusher not configured */ }
    }

    await db.patientRecord.update({
      where: { id: recordId },
      data: { visit: JSON.parse(JSON.stringify(visit)) },
    });

    await logAudit({
      actorType: "doctor", actorId: completedBy || "doctor", hospitalId: hospital.id,
      action: chainTo ? "referral.completed_and_chained" : "referral.completed",
      metadata: { recordId, referralId, chainedTo: chainTo?.targetStation },
      ipAddress: getClientIP(request),
    });

    return Response.json({ success: true, chained: !!chainTo, chainedReferral: chainedRef });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}
