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

  // ─── Create Ops Staff ───
  if (action === "create_ops_staff") {
    const { name, email, pin, allowedScreens } = body;
    if (!name || !email || !pin || !/^\d{4}$/.test(pin)) {
      return Response.json({ error: "Name, email, and 4-digit PIN required" }, { status: 400 });
    }
    const existing = await db.dalxicStaff.findUnique({ where: { email } });
    if (existing) return Response.json({ error: "Email already exists" }, { status: 409 });

    const pinHash = await sha256(pin);
    const staff = await db.dalxicStaff.create({
      data: { name, email, role: "support", pin: pinHash, allowedScreens: JSON.stringify(allowedScreens || []), isActive: true },
    });
    return Response.json({ id: staff.id, name: staff.name, email: staff.email }, { status: 201 });
  }

  // ─── List Ops Staff ───
  if (action === "list_ops_staff") {
    const staff = await db.dalxicStaff.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, role: true, allowedScreens: true, isActive: true, lastOpsLoginAt: true },
    });
    return Response.json(staff.map(s => ({ ...s, allowedScreens: s.allowedScreens ? JSON.parse(s.allowedScreens) : [] })));
  }

  // ─── Edit Ops Staff ───
  if (action === "edit_ops_staff") {
    const { staffId, name, allowedScreens, resetPin } = body;
    if (!staffId) return Response.json({ error: "staffId required" }, { status: 400 });

    const data: Record<string, unknown> = {};
    if (name) data.name = name;
    if (allowedScreens !== undefined) data.allowedScreens = JSON.stringify(allowedScreens);
    if (resetPin && /^\d{4}$/.test(resetPin)) data.pin = await sha256(resetPin);

    const updated = await db.dalxicStaff.update({ where: { id: staffId }, data });
    return Response.json({ id: updated.id, name: updated.name });
  }

  // ─── Toggle Ops Staff Active ───
  if (action === "toggle_ops_staff") {
    const { staffId } = body;
    if (!staffId) return Response.json({ error: "staffId required" }, { status: 400 });
    const staff = await db.dalxicStaff.findUnique({ where: { id: staffId } });
    if (!staff) return Response.json({ error: "Staff not found" }, { status: 404 });
    const updated = await db.dalxicStaff.update({ where: { id: staffId }, data: { isActive: !staff.isActive } });
    return Response.json({ id: updated.id, isActive: updated.isActive });
  }

  // ─── Verify Ops Staff (email + PIN login) ───
  if (action === "verify_ops_staff") {
    const { email, pin } = body;
    if (!email || !pin) return Response.json({ error: "Email and PIN required" }, { status: 400 });

    const staff = await db.dalxicStaff.findUnique({ where: { email } });
    if (!staff || !staff.pin) return Response.json({ valid: false, error: "Staff not found" });
    if (!staff.isActive) return Response.json({ valid: false, error: "Account deactivated" });

    const pinHash = await sha256(pin);
    if (pinHash !== staff.pin) return Response.json({ valid: false, error: "Invalid PIN" });

    // Update last login
    await db.dalxicStaff.update({ where: { id: staff.id }, data: { lastOpsLoginAt: new Date() } });

    const screens = staff.allowedScreens ? JSON.parse(staff.allowedScreens) : [];
    return Response.json({ valid: true, staffId: staff.id, staffName: staff.name, allowedScreens: screens });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}
