/**
 * WhatsApp Cloud API integration — 1-to-1 transactional messaging.
 *
 * Uses Meta's official Cloud API (free tier: 1,000 business-initiated conversations/month).
 * Each hospital can configure their own WhatsApp Business number.
 *
 * ENV:
 *   WHATSAPP_TOKEN        — Meta API bearer token
 *   WHATSAPP_PHONE_ID     — WhatsApp Business phone number ID
 *   WHATSAPP_ENABLED      — "true" to enable sending (defaults to false / dry-run)
 */

const WHATSAPP_API = "https://graph.facebook.com/v21.0";

export type MessageTemplate =
  | "queue_registered"    // Patient registered, token assigned
  | "queue_called"        // Patient's turn — proceed to doctor
  | "lab_results_ready"   // Lab results available
  | "prescription_ready"  // Medications dispensed, ready for pickup
  | "bill_generated"      // Bill summary
  | "emergency_alert"     // Emergency admission notification
  | "referral_notice"     // Referred to specialist
  | "discharge_summary";  // Discharge notification

interface TemplateParams {
  patientName: string;
  hospitalName?: string;
  [key: string]: string | number | undefined;
}

// Template message bodies — these map to WhatsApp approved templates
// In production, register these templates in Meta Business Manager
const TEMPLATE_MESSAGES: Record<MessageTemplate, (p: TemplateParams) => string> = {
  queue_registered: (p) =>
    `Hello ${p.patientName}, you have been registered at ${p.hospitalName || "the hospital"}. Your queue token is ${p.token}. Your checkout code is ${p.checkoutPin || "—"}. Please keep this code safe — you will need it when leaving. Please wait to be called.`,
  queue_called: (p) =>
    `${p.patientName}, it's your turn! Please proceed to ${p.department || "the consultation room"}. Token: ${p.token}`,
  lab_results_ready: (p) =>
    `Hello ${p.patientName}, your lab results for ${p.tests || "requested tests"} are ready. Please visit the hospital to collect them.`,
  prescription_ready: (p) =>
    `Hello ${p.patientName}, your medications have been dispensed at the pharmacy. ${p.medications ? `Items: ${p.medications}` : "Please collect them at your convenience."}`,
  bill_generated: (p) =>
    `Hello ${p.patientName}, your bill of GHS ${p.amount || "—"} has been generated at ${p.hospitalName || "the hospital"}. ${p.paymentMethod ? `Payment: ${p.paymentMethod}` : "Please visit billing."}`,
  emergency_alert: (p) =>
    `URGENT: ${p.patientName} has been admitted as an emergency at ${p.hospitalName || "the hospital"}. ER Token: ${p.token}. Please contact the hospital immediately.`,
  referral_notice: (p) =>
    `Hello ${p.patientName}, you have been referred to ${p.specialty || "a specialist"} at ${p.hospitalName || "the hospital"}. Reason: ${p.reason || "specialist evaluation"}. Please check with the front desk.`,
  discharge_summary: (p) => {
    const lines: string[] = [];
    lines.push(`*${p.hospitalName || "Hospital"}*`);
    lines.push(`_Visit Summary_\n`);
    lines.push(`*Patient:* ${p.patientName}`);
    if (p.department) lines.push(`*Department:* ${p.department}`);
    if (p.token) lines.push(`*Token:* ${p.token}`);
    if (p.diagnosis) lines.push(`\n*Diagnosis:* ${p.diagnosis}`);
    if (p.prescriptions) lines.push(`\n*Prescriptions:*\n${p.prescriptions}`);
    if (p.followUp) lines.push(`\n*Follow-Up:* ${p.followUp}`);
    lines.push(`\nThank you for visiting ${p.hospitalName || "the hospital"}.`);
    lines.push(`_Powered by DalxicHealth_`);
    return lines.join("\n");
  },
};

/**
 * Send a WhatsApp message to a patient.
 * Returns { sent: true, messageId } on success, { sent: false, reason } on failure.
 */
export async function sendWhatsApp(
  phone: string,
  template: MessageTemplate,
  params: TemplateParams
): Promise<{ sent: boolean; messageId?: string; reason?: string; message?: string }> {
  // Validate phone
  if (!phone || phone.length < 8) {
    return { sent: false, reason: "invalid_phone" };
  }

  // Normalize Ghanaian phone numbers: 0XX → 233XX
  let normalizedPhone = phone.replace(/[\s\-()]/g, "");
  if (normalizedPhone.startsWith("0")) {
    normalizedPhone = "233" + normalizedPhone.slice(1);
  }
  if (!normalizedPhone.startsWith("+")) {
    normalizedPhone = "+" + normalizedPhone;
  }

  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const enabled = process.env.WHATSAPP_ENABLED === "true";

  // Build the message text
  const messageText = TEMPLATE_MESSAGES[template](params);

  // Dry-run mode — log but don't send
  if (!enabled || !token || !phoneId) {
    console.log(`[WhatsApp DRY-RUN] To: ${normalizedPhone} | Template: ${template} | Message: ${messageText}`);
    return { sent: false, reason: "dry_run", message: messageText };
  }

  try {
    const res = await fetch(`${WHATSAPP_API}/${phoneId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: normalizedPhone,
        type: "text",
        text: { body: messageText },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`[WhatsApp ERROR] ${res.status}: ${err}`);
      return { sent: false, reason: `api_error_${res.status}`, message: messageText };
    }

    const data = await res.json();
    const messageId = data.messages?.[0]?.id;
    console.log(`[WhatsApp SENT] To: ${normalizedPhone} | ID: ${messageId}`);
    return { sent: true, messageId, message: messageText };
  } catch (err) {
    console.error("[WhatsApp ERROR]", err);
    return { sent: false, reason: "network_error", message: messageText };
  }
}

/**
 * Send WhatsApp to a patient by record ID — fetches phone from patient JSON.
 * Convenience wrapper used by station hooks.
 */
export async function notifyPatient(
  recordId: string,
  template: MessageTemplate,
  extraParams: Record<string, string | number | undefined> = {}
): Promise<{ sent: boolean; reason?: string }> {
  // Dynamic import to avoid circular deps
  const { db } = await import("./db");

  const record = await db.patientRecord.findUnique({ where: { id: recordId } });
  if (!record) return { sent: false, reason: "record_not_found" };

  const patient = record.patient as { fullName?: string; phone?: string };
  if (!patient.phone) return { sent: false, reason: "no_phone" };

  const visit = record.visit as { queueToken?: string; department?: string };
  const hospital = await db.hospital.findUnique({ where: { id: record.hospitalId } });

  return sendWhatsApp(patient.phone, template, {
    patientName: patient.fullName || "Patient",
    hospitalName: hospital?.name || undefined,
    token: visit.queueToken || undefined,
    department: visit.department || undefined,
    ...extraParams,
  });
}
