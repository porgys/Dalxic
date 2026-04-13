import { logAudit, getClientIP } from "@/lib/audit";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
const WHATSAPP_API = "https://graph.facebook.com/v21.0";

// POST: Send patient visit summary as a WhatsApp text message
export async function POST(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;
  const body = await request.json();
  const { recordId, phoneNumber } = body;

  if (!recordId || !phoneNumber) {
    return Response.json({ error: "recordId and phoneNumber required" }, { status: 400 });
  }

  const record = await db.patientRecord.findUnique({
    where: { id: recordId },
    include: { hospital: true },
  });

  if (!record) {
    return Response.json({ error: "Record not found" }, { status: 404 });
  }

  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    return Response.json({ error: "WhatsApp not configured" }, { status: 503 });
  }

  const formattedPhone = formatGhanaPhone(phoneNumber);

  // Build message from record data
  const patient = record.patient as Record<string, string>;
  const visit = record.visit as Record<string, string>;
  const diagnosis = record.diagnosis as Record<string, unknown>;
  const treatment = record.treatment as { prescriptions?: { medication: string; dosage: string; frequency: string; duration: string }[] } | null;

  const lines: string[] = [];
  lines.push(`*${record.hospital.name}*`);
  lines.push(`_Visit Summary_`);
  lines.push(``);
  lines.push(`*Patient:* ${patient.fullName ?? "N/A"}`);
  lines.push(`*Date:* ${visit.date ?? new Date().toLocaleDateString()}`);
  lines.push(`*Department:* ${visit.department ?? "General"}`);
  if (visit.queueToken) lines.push(`*Token:* ${visit.queueToken}`);
  lines.push(``);
  if (visit.chiefComplaint) {
    lines.push(`*Complaint:* ${visit.chiefComplaint}`);
  }
  if (diagnosis?.primary) {
    lines.push(`*Diagnosis:* ${diagnosis.primary}`);
  }
  if (diagnosis?.notes) {
    lines.push(`*Notes:* ${diagnosis.notes}`);
  }
  lines.push(``);
  if (treatment?.prescriptions && treatment.prescriptions.length > 0) {
    lines.push(`*Prescriptions:*`);
    treatment.prescriptions.forEach((rx, i) => {
      lines.push(`${i + 1}. ${rx.medication} — ${rx.dosage}, ${rx.frequency}, ${rx.duration}`);
    });
    lines.push(``);
  }
  lines.push(`Thank you for visiting ${record.hospital.name}.`);
  lines.push(`_Powered by DalxicHealth_`);

  const message = lines.join("\n");

  try {
    const res = await fetch(`${WHATSAPP_API}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "text",
        text: { body: message },
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("[whatsapp] Send failed:", err);
      return Response.json({ error: "Failed to send WhatsApp message" }, { status: 502 });
    }

    const result = await res.json();

    await logAudit({
      actorType: "device_operator",
      actorId: "system",
      hospitalId: record.hospitalId,
      action: "whatsapp.summary_sent",
      metadata: { recordId, phone: formattedPhone, messageId: result.messages?.[0]?.id },
      ipAddress: getClientIP(request),
    });

    return Response.json({ success: true, messageId: result.messages?.[0]?.id });
  } catch (error) {
    console.error("[whatsapp] Error:", error);
    return Response.json({ error: "WhatsApp delivery failed" }, { status: 500 });
  }
}

function formatGhanaPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]/g, "");
  if (cleaned.startsWith("+233")) return cleaned;
  if (cleaned.startsWith("233")) return `+${cleaned}`;
  if (cleaned.startsWith("0")) return `+233${cleaned.slice(1)}`;
  return `+233${cleaned}`;
}
