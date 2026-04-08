import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { generateDeviceCode, ROLE_PREFIXES } from "@/lib/tokens";
import { createHash } from "crypto";

function hashPin(pin: string): string {
  return createHash("sha256").update(pin).digest("hex");
}

// GET: List devices for a hospital
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hospitalId = searchParams.get("hospitalId");

  if (!hospitalId) {
    return Response.json({ error: "hospitalId required" }, { status: 400 });
  }

  const devices = await db.device.findMany({
    where: { hospitalId },
    orderBy: { deviceCode: "asc" },
  });

  return Response.json(devices);
}

// POST: Register a new device
export async function POST(request: Request) {
  const body = await request.json();
  const { hospitalId, deviceName, role, pin, assignedBy } = body;

  if (!hospitalId || !deviceName || !role || !pin || !assignedBy) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const hospital = await db.hospital.findUnique({ where: { id: hospitalId } });
  if (!hospital) {
    return Response.json({ error: "Hospital not found" }, { status: 404 });
  }

  const prefix = ROLE_PREFIXES[role];
  if (!prefix) {
    return Response.json({ error: "Invalid device role" }, { status: 400 });
  }

  // Count existing devices with this role for sequencing
  const existingCount = await db.device.count({
    where: { hospitalId, role },
  });

  const deviceCode = generateDeviceCode(hospital.code, prefix, existingCount + 1);

  const device = await db.device.create({
    data: {
      hospitalId,
      deviceCode,
      deviceName,
      role,
      pinHash: hashPin(pin),
      assignedBy,
    },
  });

  await logAudit({
    actorType: "hospital_admin",
    actorId: assignedBy,
    hospitalId,
    action: "device.registered",
    metadata: { deviceCode, role },
    ipAddress: getClientIP(request),
  });

  return Response.json(device, { status: 201 });
}

// PATCH: Update device (role change, lock/unlock, deactivate)
export async function PATCH(request: Request) {
  const body = await request.json();
  const { deviceId, action, role, pin, actorId, actorType } = body;

  if (!deviceId || !action || !actorId) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const device = await db.device.findUnique({ where: { id: deviceId } });
  if (!device) {
    return Response.json({ error: "Device not found" }, { status: 404 });
  }

  let updateData: Record<string, unknown> = {};
  let auditAction = "";

  switch (action) {
    case "change_role":
      if (!role) return Response.json({ error: "role required" }, { status: 400 });
      updateData = { role };
      auditAction = "device.role_changed";
      break;
    case "lock":
      updateData = { isLocked: true };
      auditAction = "device.locked";
      break;
    case "unlock":
      updateData = { isLocked: false };
      auditAction = "device.unlocked";
      break;
    case "deactivate":
      updateData = { isActive: false };
      auditAction = "device.deactivated";
      break;
    case "activate":
      updateData = { isActive: true };
      auditAction = "device.activated";
      break;
    case "reset_pin":
      if (!pin) return Response.json({ error: "pin required" }, { status: 400 });
      updateData = { pinHash: hashPin(pin) };
      auditAction = "device.pin_reset";
      break;
    default:
      return Response.json({ error: "Invalid action" }, { status: 400 });
  }

  const updated = await db.device.update({
    where: { id: deviceId },
    data: updateData,
  });

  await logAudit({
    actorType: actorType ?? "hospital_admin",
    actorId,
    hospitalId: device.hospitalId,
    action: auditAction,
    metadata: { deviceCode: device.deviceCode, ...updateData },
    ipAddress: getClientIP(request),
  });

  return Response.json(updated);
}
