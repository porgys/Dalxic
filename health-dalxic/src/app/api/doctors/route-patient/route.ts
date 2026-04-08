import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";

/**
 * POST: Three-layer doctor routing
 * 1. Specialty-based — filter eligible doctors
 * 2. Load-balanced — pick doctor with fewest active patients
 * 3. Round-robin — tiebreaker (lowest activePatientCount wins, then alphabetical)
 */
export async function POST(request: Request) {
  const body = await request.json();
  const { hospitalCode, department, recordId } = body;

  if (!hospitalCode || !department) {
    return Response.json({ error: "hospitalCode and department required" }, { status: 400 });
  }

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) {
    return Response.json({ error: "Hospital not found" }, { status: 404 });
  }

  // Map department to specialty (front-desk departments → doctor specialties)
  const specialtyMap: Record<string, string> = {
    general: "general",
    emergency: "emergency",
    pediatrics: "pediatrics",
    obstetrics: "obstetrics",
    surgery: "surgery",
    dental: "dental",
    eye: "eye",
    ent: "ent",
  };
  const specialty = specialtyMap[department] || "general";

  // Layer 1: Specialty-based filter — available doctors in that specialty under capacity
  let eligible = await db.doctor.findMany({
    where: {
      hospitalId: hospital.id,
      specialty,
      status: "AVAILABLE",
    },
    orderBy: [{ activePatientCount: "asc" }, { name: "asc" }],
  });

  // Filter by capacity
  eligible = eligible.filter((d) => d.activePatientCount < d.maxConcurrentPatients);

  // Fallback: if no specialist available, try ON_CALL doctors of same specialty
  if (eligible.length === 0) {
    eligible = await db.doctor.findMany({
      where: {
        hospitalId: hospital.id,
        specialty,
        status: "ON_CALL",
      },
      orderBy: [{ activePatientCount: "asc" }, { name: "asc" }],
    });
    eligible = eligible.filter((d) => d.activePatientCount < d.maxConcurrentPatients);
  }

  // Fallback: try general doctors if specialty-specific ones unavailable
  if (eligible.length === 0 && specialty !== "general") {
    eligible = await db.doctor.findMany({
      where: {
        hospitalId: hospital.id,
        specialty: "general",
        status: { in: ["AVAILABLE", "ON_CALL"] },
      },
      orderBy: [{ activePatientCount: "asc" }, { name: "asc" }],
    });
    eligible = eligible.filter((d) => d.activePatientCount < d.maxConcurrentPatients);
  }

  if (eligible.length === 0) {
    return Response.json({
      assigned: false,
      reason: "No available doctors for this specialty",
      doctor: null,
    });
  }

  // Layer 2 & 3: Load-balanced + round-robin (already sorted by activePatientCount ASC, name ASC)
  const assigned = eligible[0];

  // Increment active patient count
  await db.doctor.update({
    where: { id: assigned.id },
    data: { activePatientCount: { increment: 1 } },
  });

  // Update the patient record with assigned doctor
  if (recordId) {
    const record = await db.patientRecord.findUnique({ where: { id: recordId } });
    if (record) {
      const visit = record.visit as Record<string, unknown>;
      await db.patientRecord.update({
        where: { id: recordId },
        data: {
          visit: JSON.parse(JSON.stringify({
            ...visit,
            assignedDoctor: assigned.name,
            assignedDoctorId: assigned.id,
          })),
        },
      });
    }
  }

  await logAudit({
    actorType: "device_operator",
    actorId: "system",
    hospitalId: hospital.id,
    action: "doctor.patient_routed",
    metadata: { doctorId: assigned.id, doctorName: assigned.name, recordId, department, specialty },
    ipAddress: getClientIP(request),
  });

  return Response.json({
    assigned: true,
    doctor: {
      id: assigned.id,
      name: assigned.name,
      specialty: assigned.specialty,
      role: assigned.role,
      activePatientCount: assigned.activePatientCount + 1,
      maxConcurrentPatients: assigned.maxConcurrentPatients,
    },
  });
}
