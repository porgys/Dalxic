import { logAudit, getClientIP } from "@/lib/audit";
import { db } from "@/lib/db";

const WHATSAPP_API = "https://graph.facebook.com/v21.0";

// POST: Send patient report PDF via WhatsApp
export async function POST(request: Request) {
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

  // Format phone for Ghana: ensure +233 prefix
  const formattedPhone = formatGhanaPhone(phoneNumber);

  try {
    // First, generate the PDF URL
    const pdfUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/reports?recordId=${recordId}&type=patient`;

    // Send document message via Meta Cloud API
    const res = await fetch(`${WHATSAPP_API}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "document",
        document: {
          link: pdfUrl,
          filename: `report-${record.hospital.code}.pdf`,
          caption: `Your medical report from ${record.hospital.name}. Thank you for visiting.`,
        },
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
      action: "whatsapp.report_sent",
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
