import { db } from "@/lib/db";
import { rateLimit, AUTH_RATE_LIMIT } from "@/lib/rate-limit";

/**
 * System Config API — manages ops password hash + master PINs per hospital.
 *
 * GET:   Check if ops password is set, get master PIN status per hospital
 * POST:  Set/verify ops password, set master PIN per hospital
 */

async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// GET: Check config status
export async function GET(request: Request) {
  const blocked = rateLimit(request, AUTH_RATE_LIMIT); if (blocked) return blocked;
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  // Check if ops password is set
  if (action === "ops_password_status") {
    const config = await db.systemConfig.findUnique({ where: { key: "ops_password_hash" } });
    return Response.json({ isSet: !!config });
  }

  // Get master PIN status for all hospitals
  if (action === "master_pin_status") {
    const configs = await db.systemConfig.findMany({
      where: { key: { startsWith: "master_pin:" } },
    });
    const pinMap: Record<string, boolean> = {};
    for (const c of configs) {
      const hospitalId = c.key.replace("master_pin:", "");
      pinMap[hospitalId] = true;
    }
    return Response.json({ pins: pinMap });
  }

  return Response.json({ error: "action required: ops_password_status | master_pin_status" }, { status: 400 });
}

// POST: Set/verify password, set master PIN
export async function POST(request: Request) {
  const blocked = rateLimit(request, AUTH_RATE_LIMIT); if (blocked) return blocked;
  const body = await request.json();
  const { action } = body;

  // ─── Set Ops Password ───
  if (action === "set_ops_password") {
    const { password, currentPassword } = body;
    if (!password || password.length < 8) {
      return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    // If password already set, require current password to change
    const existing = await db.systemConfig.findUnique({ where: { key: "ops_password_hash" } });
    if (existing) {
      if (!currentPassword) {
        return Response.json({ error: "Current password required to change" }, { status: 400 });
      }
      const currentHash = await sha256(currentPassword);
      if (currentHash !== existing.value) {
        return Response.json({ error: "Current password incorrect" }, { status: 401 });
      }
    }

    const hash = await sha256(password);
    await db.systemConfig.upsert({
      where: { key: "ops_password_hash" },
      update: { value: hash },
      create: { key: "ops_password_hash", value: hash },
    });

    return Response.json({ success: true });
  }

  // ─── Verify Ops Password ───
  if (action === "verify_ops_password") {
    const { password } = body;
    if (!password) {
      return Response.json({ error: "Password required" }, { status: 400 });
    }

    const config = await db.systemConfig.findUnique({ where: { key: "ops_password_hash" } });
    if (!config) {
      // No password set — first-time access
      return Response.json({ valid: false, notSet: true });
    }

    const hash = await sha256(password);
    return Response.json({ valid: hash === config.value });
  }

  // ─── Set Master PIN ───
  if (action === "set_master_pin") {
    const { hospitalId, pin } = body;
    if (!hospitalId) {
      return Response.json({ error: "hospitalId required" }, { status: 400 });
    }
    if (!pin || !/^\d{4}$/.test(pin)) {
      return Response.json({ error: "4-digit PIN required" }, { status: 400 });
    }

    const hash = await sha256(pin);
    const key = `master_pin:${hospitalId}`;
    await db.systemConfig.upsert({
      where: { key },
      update: { value: hash },
      create: { key, value: hash },
    });

    return Response.json({ success: true });
  }

  // ─── Remove Master PIN ───
  if (action === "remove_master_pin") {
    const { hospitalId } = body;
    if (!hospitalId) {
      return Response.json({ error: "hospitalId required" }, { status: 400 });
    }

    const key = `master_pin:${hospitalId}`;
    await db.systemConfig.deleteMany({ where: { key } });
    return Response.json({ success: true });
  }

  // ─── Verify Master PIN (used by StationGate) ───
  if (action === "verify_master_pin") {
    const { hospitalId, pin } = body;
    if (!hospitalId || !pin) {
      return Response.json({ valid: false });
    }

    const key = `master_pin:${hospitalId}`;
    const config = await db.systemConfig.findUnique({ where: { key } });
    if (!config) return Response.json({ valid: false });

    const hash = await sha256(pin);
    return Response.json({ valid: hash === config.value });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}
