import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

type PricingBlob = {
  defaults?: Record<string, number>;
  doctors?: Record<string, { fee?: number; commission?: number; department?: string }>;
  wards?: Record<string, Record<string, number>>;
  services?: Record<string, Record<string, number>>;
};

async function loadHospital(code: string) {
  return db.hospital.findUnique({ where: { code } });
}

function pricingFromSettings(settings: unknown): PricingBlob {
  const s = (settings ?? {}) as { pricing?: PricingBlob };
  return s.pricing ?? {};
}

function mergeSettings(existing: unknown, pricing: PricingBlob) {
  const s = (existing ?? {}) as Record<string, unknown>;
  return { ...s, pricing };
}

// GET /api/pricing?hospitalCode=KBH
// Returns full pricing blob plus enrichments (doctor names, ward names).
export async function GET(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;
  const { searchParams } = new URL(request.url);
  const hospitalCode = searchParams.get("hospitalCode");
  if (!hospitalCode) return Response.json({ error: "hospitalCode required" }, { status: 400 });

  const hospital = await loadHospital(hospitalCode);
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  const pricing = pricingFromSettings(hospital.settings);

  const [doctors, wards, servicePrices] = await Promise.all([
    db.doctor.findMany({
      where: { hospitalId: hospital.id },
      select: { id: true, name: true, specialty: true, department: true, consultationFee: true, commissionRate: true },
      orderBy: { name: "asc" },
    }),
    db.ward.findMany({
      where: { hospitalId: hospital.id },
      select: { id: true, name: true, type: true, isActive: true },
      orderBy: { name: "asc" },
    }),
    db.servicePrice.findMany({
      where: { hospitalId: hospital.id, isActive: true },
      orderBy: [{ serviceType: "asc" }, { name: "asc" }],
    }),
  ]);

  return Response.json({
    pricing,
    doctors,
    wards,
    legacyServicePrices: servicePrices,
  });
}

// POST /api/pricing
// Actions: set_defaults | set_doctor | set_ward | set_service | delete_service | delete_ward_class | delete_doctor
export async function POST(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;
  const body = await request.json();
  const { hospitalCode, action, performedBy } = body as { hospitalCode: string; action: string; performedBy?: string };

  if (!hospitalCode || !action) return Response.json({ error: "hospitalCode and action required" }, { status: 400 });

  const hospital = await loadHospital(hospitalCode);
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  const before = pricingFromSettings(hospital.settings);
  const next: PricingBlob = JSON.parse(JSON.stringify(before));

  if (action === "set_defaults") {
    const { defaults } = body as { defaults: Record<string, number> };
    if (!defaults || typeof defaults !== "object") {
      return Response.json({ error: "defaults object required" }, { status: 400 });
    }
    next.defaults = { ...(next.defaults || {}), ...defaults };
  } else if (action === "set_doctor") {
    const { doctorId, fee, commission, department } = body as {
      doctorId: string; fee?: number | null; commission?: number | null; department?: string | null;
    };
    if (!doctorId) return Response.json({ error: "doctorId required" }, { status: 400 });
    next.doctors = next.doctors || {};
    const current = next.doctors[doctorId] || {};
    if (fee === null) delete current.fee;
    else if (typeof fee === "number") current.fee = fee;
    if (commission === null) delete current.commission;
    else if (typeof commission === "number") current.commission = commission;
    if (department === null) delete current.department;
    else if (typeof department === "string") current.department = department;
    if (Object.keys(current).length === 0) delete next.doctors[doctorId];
    else next.doctors[doctorId] = current;
  } else if (action === "delete_doctor") {
    const { doctorId } = body as { doctorId: string };
    if (!doctorId) return Response.json({ error: "doctorId required" }, { status: 400 });
    if (next.doctors) delete next.doctors[doctorId];
  } else if (action === "set_ward") {
    const { wardName, bedClass, rate } = body as { wardName: string; bedClass: string; rate: number };
    if (!wardName || !bedClass || typeof rate !== "number") {
      return Response.json({ error: "wardName, bedClass, rate required" }, { status: 400 });
    }
    next.wards = next.wards || {};
    next.wards[wardName] = next.wards[wardName] || {};
    next.wards[wardName][bedClass] = rate;
  } else if (action === "delete_ward_class") {
    const { wardName, bedClass } = body as { wardName: string; bedClass: string };
    if (!wardName || !bedClass) return Response.json({ error: "wardName, bedClass required" }, { status: 400 });
    if (next.wards?.[wardName]) {
      delete next.wards[wardName][bedClass];
      if (Object.keys(next.wards[wardName]).length === 0) delete next.wards[wardName];
    }
  } else if (action === "set_service") {
    const { serviceType, name, price } = body as { serviceType: string; name: string; price: number };
    if (!serviceType || !name || typeof price !== "number") {
      return Response.json({ error: "serviceType, name, price required" }, { status: 400 });
    }
    next.services = next.services || {};
    next.services[serviceType] = next.services[serviceType] || {};
    next.services[serviceType][name] = price;
  } else if (action === "delete_service") {
    const { serviceType, name } = body as { serviceType: string; name: string };
    if (!serviceType || !name) return Response.json({ error: "serviceType, name required" }, { status: 400 });
    if (next.services?.[serviceType]) {
      delete next.services[serviceType][name];
      if (Object.keys(next.services[serviceType]).length === 0) delete next.services[serviceType];
    }
  } else {
    return Response.json({ error: "Invalid action" }, { status: 400 });
  }

  const newSettings = mergeSettings(hospital.settings, next);
  await db.hospital.update({
    where: { id: hospital.id },
    data: { settings: JSON.parse(JSON.stringify(newSettings)) },
  });

  await logAudit({
    actorType: "device_operator",
    actorId: performedBy || "admin",
    hospitalId: hospital.id,
    action: `pricing.${action}`,
    metadata: { before, after: next },
    ipAddress: getClientIP(request),
  });

  return Response.json({ success: true, pricing: next });
}
