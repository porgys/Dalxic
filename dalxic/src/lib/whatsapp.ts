const WHATSAPP_API = "https://graph.facebook.com/v21.0";

export type MessageTemplate =
  | "sale_receipt"
  | "low_stock_alert"
  | "fee_reminder"
  | "fee_received"
  | "enrollment_confirm"
  | "schedule_update";

interface TemplateParams {
  recipientName: string;
  orgName?: string;
  [key: string]: string | number | undefined;
}

const TEMPLATE_MESSAGES: Record<MessageTemplate, (p: TemplateParams) => string> = {
  sale_receipt: (p) =>
    `Hello ${p.recipientName}, your purchase at ${p.orgName || "the store"} is confirmed. Receipt: ${p.receiptCode || "—"}. Total: GHS ${p.total || "—"}. Thank you for your patronage!`,

  low_stock_alert: (p) =>
    `[${p.orgName || "Store"}] ALERT: ${p.productName || "A product"} is running low (${p.currentStock || 0} remaining, minimum: ${p.minStock || 5}). Please restock soon.`,

  fee_reminder: (p) =>
    `Hello ${p.recipientName}, this is a reminder that your fee of GHS ${p.amount || "—"} for ${p.description || "school fees"} at ${p.orgName || "the institution"} is ${p.status || "pending"}. Balance: GHS ${p.balance || "—"}.`,

  fee_received: (p) =>
    `Hello ${p.recipientName}, your payment of GHS ${p.amount || "—"} has been received at ${p.orgName || "the institution"}. Remaining balance: GHS ${p.balance || "0"}. Thank you!`,

  enrollment_confirm: (p) =>
    `Hello ${p.recipientName}, enrollment at ${p.orgName || "the institution"} is confirmed. ${p.groupName ? `Class/Group: ${p.groupName}. ` : ""}Welcome aboard!`,

  schedule_update: (p) =>
    `[${p.orgName || "Institution"}] Schedule update: ${p.subject || "A class"} on ${p.day || "—"} has been ${p.changeType || "updated"}. ${p.details || "Please check the timetable."}`,
};

export async function sendWhatsApp(
  phone: string,
  template: MessageTemplate,
  params: TemplateParams
): Promise<{ sent: boolean; messageId?: string; reason?: string; message?: string }> {
  if (!phone || phone.length < 8) {
    return { sent: false, reason: "invalid_phone" };
  }

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

  const messageText = TEMPLATE_MESSAGES[template](params);

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
