const PAYSTACK_BASE = "https://api.paystack.co";

function getSecretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not set");
  return key;
}

function headers(): HeadersInit {
  return {
    Authorization: `Bearer ${getSecretKey()}`,
    "Content-Type": "application/json",
  };
}

const MTN_PREFIXES = ["024", "054", "055", "059"];
const VODAFONE_PREFIXES = ["020", "050"];
const AIRTELTIGO_PREFIXES = ["026", "056"];

type MoMoProvider = "mtn" | "vod" | "tgo";

export function normalizeGhanaPhone(phone: string): string | null {
  const digits = phone.replace(/[\s\-()]/g, "");

  if (/^0\d{9}$/.test(digits)) return digits;
  if (/^\+233\d{9}$/.test(digits)) return "0" + digits.slice(4);
  if (/^233\d{9}$/.test(digits)) return "0" + digits.slice(3);

  return null;
}

export function detectMoMoProvider(phone: string): MoMoProvider | null {
  const normalized = normalizeGhanaPhone(phone);
  if (!normalized) return null;

  const prefix = normalized.slice(0, 3);

  if (MTN_PREFIXES.includes(prefix)) return "mtn";
  if (VODAFONE_PREFIXES.includes(prefix)) return "vod";
  if (AIRTELTIGO_PREFIXES.includes(prefix)) return "tgo";

  return null;
}

interface ChargeParams {
  amount: number;
  phone: string;
  email?: string;
  reference: string;
}

interface ChargeResult {
  success: boolean;
  reference: string;
  status: string;
  displayText: string;
}

export async function initiateMoMoCharge({
  amount,
  phone,
  email,
  reference,
}: ChargeParams): Promise<ChargeResult> {
  const normalized = normalizeGhanaPhone(phone);
  if (!normalized) {
    return {
      success: false,
      reference,
      status: "failed",
      displayText: "Invalid Ghana phone number format",
    };
  }

  const provider = detectMoMoProvider(normalized);
  if (!provider) {
    return {
      success: false,
      reference,
      status: "failed",
      displayText:
        "Unsupported network. Please use MTN, Vodafone, or AirtelTigo",
    };
  }

  const body = {
    amount,
    email: email || `${normalized}@customer.dalxic.com`,
    currency: "GHS",
    mobile_money: {
      phone: normalized,
      provider,
    },
    reference,
  };

  try {
    const res = await fetch(`${PAYSTACK_BASE}/charge`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        reference,
        status: "failed",
        displayText: data.data?.message || data.message || "Payment request failed. Please try again",
      };
    }

    return {
      success: data.status === true,
      reference: data.data?.reference || reference,
      status: data.data?.status || "pending",
      displayText:
        data.data?.display_text ||
        "Please approve the payment prompt on your phone",
    };
  } catch {
    return {
      success: false,
      reference,
      status: "failed",
      displayText: "Could not reach payment provider. Check your connection",
    };
  }
}

interface OtpResult {
  success: boolean;
  reference: string;
  status: string;
  displayText: string;
}

export async function submitChargeOtp({
  otp,
  reference,
}: {
  otp: string;
  reference: string;
}): Promise<OtpResult> {
  try {
    const res = await fetch(`${PAYSTACK_BASE}/charge/submit_otp`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ otp, reference }),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        reference,
        status: "failed",
        displayText: data.data?.message || data.message || "OTP verification failed",
      };
    }

    return {
      success: data.status === true,
      reference: data.data?.reference || reference,
      status: data.data?.status || "pending",
      displayText:
        data.data?.display_text || "Payment processing...",
    };
  } catch {
    return {
      success: false,
      reference,
      status: "failed",
      displayText: "Could not reach payment provider. Check your connection",
    };
  }
}

interface VerifyResult {
  success: boolean;
  status: string;
  amount: number;
  paidAt: string | null;
}

export async function verifyTransaction(
  reference: string
): Promise<VerifyResult> {
  try {
    const res = await fetch(
      `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: headers() }
    );

    const data = await res.json();

    if (!res.ok || data.status !== true) {
      return {
        success: false,
        status: data.data?.status || "failed",
        amount: 0,
        paidAt: null,
      };
    }

    return {
      success: data.data.status === "success",
      status: data.data.status,
      amount: data.data.amount,
      paidAt: data.data.paid_at || null,
    };
  } catch {
    return { success: false, status: "failed", amount: 0, paidAt: null };
  }
}
