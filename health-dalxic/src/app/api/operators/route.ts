import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { rateLimit, AUTH_RATE_LIMIT } from "@/lib/rate-limit";
/**
 * Device Operator management — humans who use workstations.
 *
 * POST: Create operator, login by PIN, logout
 * GET:  List operators for a hospital
 * PATCH: Update operator details
 */

// GET: List operators for a hospital (filtered by role, active status)
export async function GET(request: Request) {
  const blocked = rateLimit(request, AUTH_RATE_LIMIT); if (blocked) return blocked;  const { searchParams } = new URL(request.url);
  const hospitalCode = searchParams.get("hospitalCode");
  const role = searchParams.get("role");
  const activeOnly = searchParams.get("activeOnly") !== "false"; // default true

  if (!hospitalCode) {
    return Response.json({ error: "hospitalCode required" }, { status: 400 });
  }

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) {
    return Response.json({ error: "Hospital not found" }, { status: 404 });
  }

  const where: Record<string, unknown> = { hospitalId: hospital.id };
  if (activeOnly) where.isActive = true;
  if (role) where.role = role;

  const operators = await db.deviceOperator.findMany({
    where,
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      phone: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      // Never return PIN in list
    },
  });

  return Response.json({ operators, hospitalId: hospital.id });
}

// POST: Create operator, login, or logout
export async function POST(request: Request) {
  const blocked = rateLimit(request, AUTH_RATE_LIMIT); if (blocked) return blocked;
  try {
  const body = await request.json();
  const { hospitalCode, action } = body;

  if (!hospitalCode || !action) {
    return Response.json({ error: "hospitalCode and action required" }, { status: 400 });
  }

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) {
    return Response.json({ error: "Hospital not found" }, { status: 404 });
  }

  // ─── CREATE: Register a new operator ───
  if (action === "create") {
    const { name, phone, pin, role } = body;

    if (!name?.trim() || !pin || !role) {
      return Response.json({ error: "name, pin, and role required" }, { status: 400 });
    }

    // Validate PIN format: exactly 4 digits
    if (!/^\d{4}$/.test(pin)) {
      return Response.json({ error: "PIN must be exactly 4 digits" }, { status: 400 });
    }

    // Check PIN uniqueness within hospital
    const existingPin = await db.deviceOperator.findUnique({
      where: { hospitalId_pin: { hospitalId: hospital.id, pin } },
    });
    if (existingPin) {
      return Response.json({ error: "This PIN is already in use at this hospital. Choose a different PIN." }, { status: 409 });
    }

    const operator = await db.deviceOperator.create({
      data: {
        hospitalId: hospital.id,
        name: name.trim(),
        phone: phone?.trim() || null,
        pin,
        role,
        isActive: true,
      },
    });

    await logAudit({
      actorType: "hospital_admin",
      actorId: "admin",
      hospitalId: hospital.id,
      action: "operator.created",
      metadata: { operatorId: operator.id, name: operator.name, role },
      ipAddress: getClientIP(request),
    });

    return Response.json({
      id: operator.id,
      name: operator.name,
      phone: operator.phone,
      role: operator.role,
    }, { status: 201 });
  }

  // ─── LOGIN: Authenticate by PIN ───
  if (action === "login") {
    const { pin } = body;

    if (!pin || !/^\d{4}$/.test(pin)) {
      return Response.json({ error: "4-digit PIN required" }, { status: 400 });
    }

    const operator = await db.deviceOperator.findUnique({
      where: { hospitalId_pin: { hospitalId: hospital.id, pin } },
    });

    if (!operator) {
      // Audit failed PIN attempt — append-only, uneditable
      await logAudit({
        actorType: "device_operator",
        actorId: "unknown",
        hospitalId: hospital.id,
        action: "operator.login_failed",
        metadata: { reason: "invalid_pin", userAgent: request.headers.get("user-agent") ?? "unknown" },
        ipAddress: getClientIP(request),
      }).catch(() => {});

      return Response.json({ error: "Invalid PIN. No operator found." }, { status: 401 });
    }

    if (!operator.isActive) {
      await logAudit({
        actorType: "device_operator",
        actorId: operator.id,
        hospitalId: hospital.id,
        action: "operator.login_blocked",
        metadata: { reason: "deactivated", operatorName: operator.name },
        ipAddress: getClientIP(request),
      }).catch(() => {});

      return Response.json({ error: "This operator account is deactivated. Contact admin." }, { status: 403 });
    }

    // Update last login
    await db.deviceOperator.update({
      where: { id: operator.id },
      data: { lastLoginAt: new Date() },
    });

    await logAudit({
      actorType: "device_operator",
      actorId: operator.id,
      hospitalId: hospital.id,
      action: "operator.login",
      metadata: { operatorName: operator.name, role: operator.role },
      ipAddress: getClientIP(request),
    });

    return Response.json({
      operatorId: operator.id,
      operatorName: operator.name,
      operatorRole: operator.role,
      hospitalId: hospital.id,
      hospitalCode,
      loginAt: new Date().toISOString(),
    });
  }

  // ─── LOGOUT ───
  if (action === "logout") {
    const { operatorId } = body;

    if (operatorId) {
      await logAudit({
        actorType: "device_operator",
        actorId: operatorId,
        hospitalId: hospital.id,
        action: "operator.logout",
        metadata: {},
        ipAddress: getClientIP(request),
      });
    }

    return Response.json({ success: true });
  }

  return Response.json({ error: "Invalid action. Use: create, login, logout" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown server error";
    console.error("[operators] POST error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}

// PATCH: Update operator details (name, phone, role, active status, PIN reset)
export async function PATCH(request: Request) {
  const blocked = rateLimit(request, AUTH_RATE_LIMIT); if (blocked) return blocked;  const body = await request.json();
  const { hospitalCode, operatorId, name, phone, role, isActive, newPin } = body;

  if (!hospitalCode || !operatorId) {
    return Response.json({ error: "hospitalCode and operatorId required" }, { status: 400 });
  }

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) {
    return Response.json({ error: "Hospital not found" }, { status: 404 });
  }

  const operator = await db.deviceOperator.findUnique({ where: { id: operatorId } });
  if (!operator || operator.hospitalId !== hospital.id) {
    return Response.json({ error: "Operator not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};

  if (name?.trim()) updates.name = name.trim();
  if (phone !== undefined) updates.phone = phone?.trim() || null;
  if (role) updates.role = role;
  if (isActive !== undefined) updates.isActive = isActive;

  // PIN reset
  if (newPin) {
    if (!/^\d{4}$/.test(newPin)) {
      return Response.json({ error: "PIN must be exactly 4 digits" }, { status: 400 });
    }
    // Check uniqueness
    const existingPin = await db.deviceOperator.findUnique({
      where: { hospitalId_pin: { hospitalId: hospital.id, pin: newPin } },
    });
    if (existingPin && existingPin.id !== operatorId) {
      return Response.json({ error: "This PIN is already in use" }, { status: 409 });
    }
    updates.pin = newPin;
  }

  const updated = await db.deviceOperator.update({
    where: { id: operatorId },
    data: updates,
    select: { id: true, name: true, phone: true, role: true, isActive: true },
  });

  await logAudit({
    actorType: "hospital_admin",
    actorId: "admin",
    hospitalId: hospital.id,
    action: "operator.updated",
    metadata: { operatorId, changes: Object.keys(updates) },
    ipAddress: getClientIP(request),
  });

  return Response.json(updated);
}
