import { getPusher, hospitalChannel } from "@/lib/pusher-server";
import { logAudit, getClientIP } from "@/lib/audit";
import { db } from "@/lib/db";
import { sendWhatsApp } from "@/lib/whatsapp";

// POST: Trigger a callout event (doctor calls a patient number)
export async function POST(request: Request) {
  const body = await request.json();
  const { hospitalCode, token, patientName, department, room, calledBy } = body;

  if (!hospitalCode || !token) {
    return Response.json({ error: "hospitalCode and token required" }, { status: 400 });
  }

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  const calloutEvent = {
    token,
    patientName: patientName || "Patient",
    department: department || "",
    room: room || null,
    calledBy: calledBy || "Doctor",
    timestamp: new Date().toISOString(),
  };

  // Broadcast to display boards via Pusher
  try {
    const pusher = getPusher();
    // Global callout channel
    await pusher.trigger(hospitalChannel(hospitalCode, "callout"), "number-called", calloutEvent);
    // Department-specific channel
    if (department) {
      await pusher.trigger(hospitalChannel(hospitalCode, `callout-${department}`), "number-called", calloutEvent);
    }
    // Also update queue channel so waiting room knows
    await pusher.trigger(hospitalChannel(hospitalCode, "queue"), "patient-called", { queueToken: token });
  } catch { /* Pusher not configured */ }

  await logAudit({
    actorType: "doctor",
    actorId: calledBy || "doctor",
    hospitalId: hospital.id,
    action: "callout.number_called",
    metadata: { token, patientName, department, room },
    ipAddress: getClientIP(request),
  });

  // WhatsApp notification — look up patient phone from today's queue
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const record = await db.patientRecord.findFirst({
      where: { hospitalId: hospital.id, createdAt: { gte: today }, visit: { path: ["queueToken"], equals: token } },
    });
    if (record) {
      const pat = record.patient as { phone?: string; fullName?: string };
      if (pat.phone) {
        sendWhatsApp(pat.phone, "queue_called", {
          patientName: pat.fullName || "Patient",
          hospitalName: hospital.name,
          token,
          department: department || "",
        }).catch(() => {});
      }
    }
  } catch { /* non-blocking */ }

  return Response.json({ success: true, callout: calloutEvent });
}
