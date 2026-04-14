import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { getPusher, hospitalChannel } from "@/lib/pusher-server";
import { rateLimit } from "@/lib/rate-limit";
// POST: Create a shift handover between two doctors
export async function POST(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;  const body = await request.json();
  const { hospitalCode, outgoingDoctorId, incomingDoctorId, patientIds, notes } = body;

  if (!hospitalCode || !outgoingDoctorId || !incomingDoctorId) {
    return Response.json({ error: "hospitalCode, outgoingDoctorId, and incomingDoctorId required" }, { status: 400 });
  }

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  const [outgoing, incoming] = await Promise.all([
    db.doctor.findUnique({ where: { id: outgoingDoctorId } }),
    db.doctor.findUnique({ where: { id: incomingDoctorId } }),
  ]);

  if (!outgoing || !incoming) {
    return Response.json({ error: "One or both doctors not found" }, { status: 404 });
  }

  // Get active patients for outgoing doctor
  const activeRecords = await db.patientRecord.findMany({
    where: {
      hospitalId: hospital.id,
      visit: { path: ["assignedDoctorId"], equals: outgoingDoctorId },
    },
    take: 500,
  });

  const handoverPatientIds = patientIds || activeRecords.map((r) => r.id);

  // Create handover record
  const handover = await db.shiftHandover.create({
    data: {
      hospitalId: hospital.id,
      outgoingDoctorId,
      incomingDoctorId,
      patientIds: JSON.parse(JSON.stringify(handoverPatientIds)),
      notes: notes || null,
    },
  });

  // Reassign patients to incoming doctor
  for (const pid of handoverPatientIds) {
    const record = await db.patientRecord.findUnique({ where: { id: pid } });
    if (record) {
      const visit = record.visit as Record<string, unknown>;
      await db.patientRecord.update({
        where: { id: pid },
        data: {
          visit: JSON.parse(JSON.stringify({
            ...visit,
            assignedDoctor: incoming.name,
            assignedDoctorId: incoming.id,
            handoverFrom: outgoing.name,
          })),
        },
      });
    }
  }

  // Update doctor statuses and counts
  await Promise.all([
    db.doctor.update({
      where: { id: outgoingDoctorId },
      data: { status: "OFF_DUTY", activePatientCount: 0 },
    }),
    db.doctor.update({
      where: { id: incomingDoctorId },
      data: { activePatientCount: { increment: handoverPatientIds.length } },
    }),
  ]);

  // Broadcast handover event
  try {
    const pusher = getPusher();
    await pusher.trigger(hospitalChannel(hospitalCode, "doctors"), "shift-handover", {
      outgoing: outgoing.name,
      incoming: incoming.name,
      patientCount: handoverPatientIds.length,
      timestamp: new Date().toISOString(),
    });
  } catch { /* Pusher not configured */ }

  await logAudit({
    actorType: "doctor",
    actorId: outgoingDoctorId,
    hospitalId: hospital.id,
    action: "doctor.shift_handover",
    metadata: {
      outgoing: outgoing.name,
      incoming: incoming.name,
      patientCount: handoverPatientIds.length,
      handoverId: handover.id,
    },
    ipAddress: getClientIP(request),
  });

  return Response.json({
    handoverId: handover.id,
    patientsTransferred: handoverPatientIds.length,
    outgoing: outgoing.name,
    incoming: incoming.name,
  }, { status: 201 });
}
