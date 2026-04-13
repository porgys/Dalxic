import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { rateLimit, AUTH_RATE_LIMIT } from "@/lib/rate-limit";

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

  const { searchParams } = new URL(request.url);
  const orgCode = searchParams.get("orgCode");
  const role = searchParams.get("role");
  const activeOnly = searchParams.get("activeOnly") !== "false";

  if (!orgCode) return Response.json({ error: "orgCode required" }, { status: 400 });

  const org = await db.organization.findUnique({ where: { code: orgCode } });
  if (!org) return Response.json({ error: "Organization not found" }, { status: 404 });

  const where: Record<string, unknown> = { orgId: org.id };
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

  return Response.json({ operators, orgId: org.id, onlineCount });
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

    const org = await db.organization.findUnique({ where: { code: orgCode } });
    if (!org) return Response.json({ error: "Organization not found" }, { status: 404 });

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
      const count = await db.operator.count({ where: { orgId: org.id, isActive: true } });
      if (count >= org.maxOperators) {
        return Response.json({ error: `Operator limit reached (${org.maxOperators}). Upgrade your tier.` }, { status: 403 });
      }

      // Check PIN uniqueness within org
      const existingPin = await db.operator.findUnique({
        where: { orgId_pin: { orgId: org.id, pin } },
      });
      if (existingPin) {
        return Response.json({ error: "This PIN is already in use. Choose a different PIN." }, { status: 409 });
      }

      const operator = await db.operator.create({
        data: {
          orgId: org.id,
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
        actorId: "admin",
        orgId: org.id,
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

    // ─── LOGIN ───
    if (action === "login") {
      const { pin } = body;

      if (!pin || !/^\d{4}$/.test(pin)) {
        return Response.json({ error: "4-digit PIN required" }, { status: 400 });
      }

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
      const { operatorId } = body;
      if (operatorId) {
        await logAudit({
          actorType: "operator",
          actorId: operatorId,
          orgId: org.id,
          action: "operator.logout",
          metadata: {},
          ipAddress: getClientIP(request),
        });
      }
      return Response.json({ success: true });
    }

    return Response.json({ error: "Invalid action. Use: create, login, logout, heartbeat" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown server error";
    console.error("[operators] POST error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const blocked = rateLimit(request, AUTH_RATE_LIMIT);
  if (blocked) return blocked;

  try {
    const body = await request.json();
    const { orgCode, operatorId, name, phone, role, isActive, newPin, meta } = body;

    if (!orgCode || !operatorId) {
      return Response.json({ error: "orgCode and operatorId required" }, { status: 400 });
    }

    const org = await db.organization.findUnique({ where: { code: orgCode } });
    if (!org) return Response.json({ error: "Organization not found" }, { status: 404 });

    const operator = await db.operator.findUnique({ where: { id: operatorId } });
    if (!operator || operator.orgId !== org.id) {
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
        where: { orgId_pin: { orgId: org.id, pin: newPin } },
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
      actorId: "admin",
      orgId: org.id,
      action: "operator.updated",
      metadata: { operatorId, changes: Object.keys(updates) },
      ipAddress: getClientIP(request),
    });

    return Response.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[operators] PATCH error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
