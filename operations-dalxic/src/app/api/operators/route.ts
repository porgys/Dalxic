import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { rateLimit, AUTH_RATE_LIMIT, checkPinLockout, recordPinFailure, clearPinFailures } from "@/lib/rate-limit";
import { authenticateRequest } from "@/lib/auth";

/**
 * Operator management — PIN-based authentication.
 *
 * GET:   List operators for an org
 * POST:  Create operator, login, logout, heartbeat
 * PATCH: Update operator details / PIN reset
 */

export async function GET(request: Request) {
  const blocked = rateLimit(request, AUTH_RATE_LIMIT);
  if (blocked) return blocked;

  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;

  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");
  const activeOnly = searchParams.get("activeOnly") !== "false";

  const where: Record<string, unknown> = { orgId: auth.orgId };
  if (activeOnly) where.isActive = true;
  if (role) where.role = role;

  const operators = await db.operator.findMany({
    where,
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      phone: true,
      role: true,
      meta: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      // Never return PIN in list
    },
  });

  const onlineThreshold = new Date(Date.now() - 10 * 60 * 1000);
  const onlineCount = operators.filter(
    (o) => o.lastLoginAt && new Date(o.lastLoginAt) >= onlineThreshold
  ).length;

  return Response.json({ operators, orgId: auth.orgId, onlineCount });
}

export async function POST(request: Request) {
  const blocked = rateLimit(request, AUTH_RATE_LIMIT);
  if (blocked) return blocked;

  try {
    const body = await request.json();
    const { orgCode, action } = body;

    if (!orgCode || !action) {
      return Response.json({ error: "orgCode and action required" }, { status: 400 });
    }

    // ─── LOGIN — exempt from auth (this IS the auth endpoint) ───
    if (action === "login") {
      const { pin } = body;

      if (!pin || !/^\d{4}$/.test(pin)) {
        return Response.json({ error: "4-digit PIN required" }, { status: 400 });
      }

      // Check PIN lockout before attempting login
      const lockout = checkPinLockout(orgCode);
      if (lockout) return lockout;

      const org = await db.organization.findUnique({ where: { code: orgCode } });
      if (!org) return Response.json({ error: "Organization not found" }, { status: 404 });

      const operator = await db.operator.findUnique({
        where: { orgId_pin: { orgId: org.id, pin } },
      });

      if (!operator) {
        // Master PIN fallback
        const masterConfig = await db.systemConfig.findUnique({ where: { key: `master_pin:${org.id}` } });
        if (masterConfig) {
          const encoder = new TextEncoder();
          const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(pin));
          const pinHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
          if (pinHash === masterConfig.value) {
            clearPinFailures(orgCode);

            await logAudit({
              actorType: "system",
              actorId: "master_pin",
              orgId: org.id,
              action: "operator.master_login",
              metadata: { method: "master_pin" },
              ipAddress: getClientIP(request),
            }).catch(() => {});

            return Response.json({
              operatorId: "master_access",
              operatorName: "Master Access",
              operatorRole: "super_admin",
              orgId: org.id,
              orgCode: org.code,
              orgName: org.name,
              orgType: org.type,
            });
          }
        }

        // Record failed attempt
        recordPinFailure(orgCode);

        await logAudit({
          actorType: "operator",
          actorId: "unknown",
          orgId: org.id,
          action: "operator.login_failed",
          metadata: { reason: "invalid_pin" },
          ipAddress: getClientIP(request),
        }).catch(() => {});

        return Response.json({ error: "Invalid PIN. No operator found." }, { status: 401 });
      }

      if (!operator.isActive) {
        await logAudit({
          actorType: "operator",
          actorId: operator.id,
          orgId: org.id,
          action: "operator.login_blocked",
          metadata: { reason: "deactivated", operatorName: operator.name },
          ipAddress: getClientIP(request),
        }).catch(() => {});

        return Response.json({ error: "This operator account is deactivated. Contact admin." }, { status: 403 });
      }

      // Success — clear any pin failures
      clearPinFailures(orgCode);

      await db.operator.update({
        where: { id: operator.id },
        data: { lastLoginAt: new Date() },
      });

      await logAudit({
        actorType: "operator",
        actorId: operator.id,
        orgId: org.id,
        action: "operator.login",
        metadata: { operatorName: operator.name, role: operator.role },
        ipAddress: getClientIP(request),
      });

      return Response.json({
        operatorId: operator.id,
        operatorName: operator.name,
        operatorRole: operator.role,
        orgId: org.id,
        orgCode: org.code,
        orgName: org.name,
        orgType: org.type,
        activeModules: org.activeModules,
        meta: operator.meta || null,
        loginAt: new Date().toISOString(),
      });
    }

    // ─── All other actions require auth ───
    const auth = await authenticateRequest(request);
    if (auth instanceof Response) return auth;

    // ─── CREATE ───
    if (action === "create") {
      const { name, phone, pin, role, meta } = body;

      if (!name?.trim() || !pin || !role) {
        return Response.json({ error: "name, pin, and role required" }, { status: 400 });
      }

      if (!/^\d{4}$/.test(pin)) {
        return Response.json({ error: "PIN must be exactly 4 digits" }, { status: 400 });
      }

      // Check operator limit
      const org = await db.organization.findUnique({ where: { id: auth.orgId } });
      if (!org) return Response.json({ error: "Organization not found" }, { status: 404 });

      const count = await db.operator.count({ where: { orgId: auth.orgId, isActive: true } });
      if (count >= org.maxOperators) {
        return Response.json({ error: `Operator limit reached (${org.maxOperators}). Upgrade your tier.` }, { status: 403 });
      }

      // Check PIN uniqueness within org
      const existingPin = await db.operator.findUnique({
        where: { orgId_pin: { orgId: auth.orgId, pin } },
      });
      if (existingPin) {
        return Response.json({ error: "This PIN is already in use. Choose a different PIN." }, { status: 409 });
      }

      const operator = await db.operator.create({
        data: {
          orgId: auth.orgId,
          name: name.trim(),
          phone: phone?.trim() || null,
          pin,
          role,
          meta: meta ? JSON.parse(JSON.stringify(meta)) : undefined,
          isActive: true,
        },
      });

      await logAudit({
        actorType: "operator",
        actorId: auth.operatorId,
        orgId: auth.orgId,
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

    // ─── HEARTBEAT ───
    if (action === "heartbeat") {
      const { operatorId } = body;
      if (!operatorId) return Response.json({ error: "operatorId required" }, { status: 400 });
      await db.operator.update({
        where: { id: operatorId },
        data: { lastLoginAt: new Date() },
      }).catch(() => {});
      return Response.json({ ok: true });
    }

    // ─── LOGOUT ───
    if (action === "logout") {
      await logAudit({
        actorType: "operator",
        actorId: auth.operatorId,
        orgId: auth.orgId,
        action: "operator.logout",
        metadata: {},
        ipAddress: getClientIP(request),
      });
      return Response.json({ success: true });
    }

    return Response.json({ error: "Invalid action. Use: create, login, logout, heartbeat" }, { status: 400 });
  } catch (err: unknown) {
    console.error("API error:", err);
    return Response.json({ error: "An error occurred" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const blocked = rateLimit(request, AUTH_RATE_LIMIT);
  if (blocked) return blocked;

  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;

  try {
    const body = await request.json();
    const { operatorId, name, phone, role, isActive, newPin, meta } = body;

    if (!operatorId) {
      return Response.json({ error: "operatorId required" }, { status: 400 });
    }

    const operator = await db.operator.findUnique({ where: { id: operatorId } });
    if (!operator || operator.orgId !== auth.orgId) {
      return Response.json({ error: "Operator not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    if (name?.trim()) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone?.trim() || null;
    if (role) updates.role = role;
    if (isActive !== undefined) updates.isActive = isActive;
    if (meta !== undefined) updates.meta = meta ? JSON.parse(JSON.stringify(meta)) : null;

    if (newPin) {
      if (!/^\d{4}$/.test(newPin)) {
        return Response.json({ error: "PIN must be exactly 4 digits" }, { status: 400 });
      }
      const existingPin = await db.operator.findUnique({
        where: { orgId_pin: { orgId: auth.orgId, pin: newPin } },
      });
      if (existingPin && existingPin.id !== operatorId) {
        return Response.json({ error: "This PIN is already in use" }, { status: 409 });
      }
      updates.pin = newPin;
    }

    const updated = await db.operator.update({
      where: { id: operatorId },
      data: updates,
      select: { id: true, name: true, phone: true, role: true, isActive: true },
    });

    await logAudit({
      actorType: "operator",
      actorId: auth.operatorId,
      orgId: auth.orgId,
      action: "operator.updated",
      metadata: { operatorId, changes: Object.keys(updates) },
      ipAddress: getClientIP(request),
    });

    return Response.json(updated);
  } catch (err: unknown) {
    console.error("API error:", err);
    return Response.json({ error: "An error occurred" }, { status: 500 });
  }
}
