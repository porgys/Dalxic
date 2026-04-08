import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";

const VALID_BED_STATUSES = ["AVAILABLE", "OCCUPIED", "RESERVED", "MAINTENANCE", "CLEANING"] as const;
const VALID_WARD_TYPES = ["general", "icu", "maternity", "pediatric", "surgical"] as const;

// GET: Bed dashboard — wards, rooms, beds with status counts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hospitalCode = searchParams.get("hospitalCode");
  const wardId = searchParams.get("wardId");
  const status = searchParams.get("status");

  if (!hospitalCode) {
    return Response.json({ error: "hospitalCode required" }, { status: 400 });
  }

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  // If wardId specified, return rooms+beds for that ward
  if (wardId) {
    const ward = await db.ward.findUnique({
      where: { id: wardId },
      include: {
        rooms: {
          include: {
            beds: {
              where: status ? { status } : {},
              orderBy: { label: "asc" },
            },
          },
          orderBy: { name: "asc" },
        },
      },
    });
    return Response.json(ward);
  }

  // Otherwise return full dashboard summary
  const wards = await db.ward.findMany({
    where: { hospitalId: hospital.id, isActive: true },
    include: {
      rooms: {
        include: {
          beds: { orderBy: { label: "asc" } },
        },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  // Compute stats per ward
  const dashboard = wards.map((ward) => {
    const allBeds = ward.rooms.flatMap((r) => r.beds);
    const counts = {
      total: allBeds.length,
      AVAILABLE: allBeds.filter((b) => b.status === "AVAILABLE").length,
      OCCUPIED: allBeds.filter((b) => b.status === "OCCUPIED").length,
      RESERVED: allBeds.filter((b) => b.status === "RESERVED").length,
      MAINTENANCE: allBeds.filter((b) => b.status === "MAINTENANCE").length,
      CLEANING: allBeds.filter((b) => b.status === "CLEANING").length,
    };
    return { ...ward, counts };
  });

  const totalBeds = dashboard.reduce((s, w) => s + w.counts.total, 0);
  const totalAvailable = dashboard.reduce((s, w) => s + w.counts.AVAILABLE, 0);
  const totalOccupied = dashboard.reduce((s, w) => s + w.counts.OCCUPIED, 0);

  return Response.json({ wards: dashboard, summary: { totalBeds, totalAvailable, totalOccupied } });
}

// POST: Create ward, room, or bed (action-based)
export async function POST(request: Request) {
  const body = await request.json();
  const { hospitalCode, action } = body;

  if (!hospitalCode || !action) {
    return Response.json({ error: "hospitalCode and action required" }, { status: 400 });
  }

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  if (action === "create_ward") {
    const { name, type, floor } = body;
    if (!name || !type) return Response.json({ error: "name and type required" }, { status: 400 });
    if (!VALID_WARD_TYPES.includes(type)) {
      return Response.json({ error: `Invalid ward type. Valid: ${VALID_WARD_TYPES.join(", ")}` }, { status: 400 });
    }
    const ward = await db.ward.create({
      data: { hospitalId: hospital.id, name, type, floor: floor || 1 },
    });
    await logAudit({ actorType: "hospital_admin", actorId: "admin", hospitalId: hospital.id, action: "bed.ward_created", metadata: { wardId: ward.id, name, type }, ipAddress: getClientIP(request) });
    return Response.json(ward, { status: 201 });
  }

  if (action === "create_room") {
    const { wardId, name } = body;
    if (!wardId || !name) return Response.json({ error: "wardId and name required" }, { status: 400 });
    const room = await db.room.create({ data: { wardId, name } });
    await logAudit({ actorType: "hospital_admin", actorId: "admin", hospitalId: hospital.id, action: "bed.room_created", metadata: { roomId: room.id, wardId, name }, ipAddress: getClientIP(request) });
    return Response.json(room, { status: 201 });
  }

  if (action === "create_bed") {
    const { roomId, label } = body;
    if (!roomId || !label) return Response.json({ error: "roomId and label required" }, { status: 400 });
    const bed = await db.bed.create({ data: { roomId, label } });
    await logAudit({ actorType: "hospital_admin", actorId: "admin", hospitalId: hospital.id, action: "bed.created", metadata: { bedId: bed.id, roomId, label }, ipAddress: getClientIP(request) });
    return Response.json(bed, { status: 201 });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}

// PATCH: Update bed status (with transition logging)
export async function PATCH(request: Request) {
  const body = await request.json();
  const { bedId, status, patientId, triggeredBy } = body;

  if (!bedId || !status) {
    return Response.json({ error: "bedId and status required" }, { status: 400 });
  }

  if (!VALID_BED_STATUSES.includes(status as typeof VALID_BED_STATUSES[number])) {
    return Response.json({ error: `Invalid status. Valid: ${VALID_BED_STATUSES.join(", ")}` }, { status: 400 });
  }

  const bed = await db.bed.findUnique({ where: { id: bedId }, include: { room: { include: { ward: true } } } });
  if (!bed) return Response.json({ error: "Bed not found" }, { status: 404 });

  if (bed.status === status) {
    return Response.json({ error: "Bed is already in this status" }, { status: 409 });
  }

  // If setting to OCCUPIED, check it's AVAILABLE or RESERVED
  if (status === "OCCUPIED" && !["AVAILABLE", "RESERVED"].includes(bed.status)) {
    return Response.json({ error: `Cannot occupy bed from ${bed.status} status` }, { status: 409 });
  }

  // If reserving, set TTL (30 min auto-release)
  const reservedUntil = status === "RESERVED" ? new Date(Date.now() + 30 * 60 * 1000) : null;

  // Atomic update
  const updated = await db.bed.update({
    where: { id: bedId },
    data: {
      status,
      patientId: status === "OCCUPIED" ? (patientId || null) : status === "AVAILABLE" ? null : bed.patientId,
      reservedUntil,
    },
  });

  // Log transition
  await db.bedTransition.create({
    data: {
      bedId,
      fromStatus: bed.status,
      toStatus: status,
      triggeredBy: triggeredBy || "system",
      patientId: patientId || null,
    },
  });

  await logAudit({
    actorType: "device_operator",
    actorId: triggeredBy || "system",
    hospitalId: bed.room.ward.hospitalId,
    action: "bed.status_changed",
    metadata: { bedId, from: bed.status, to: status, patientId, label: bed.label },
    ipAddress: getClientIP(request),
  });

  return Response.json(updated);
}
