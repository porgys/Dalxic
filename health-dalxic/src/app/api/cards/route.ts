import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { logAudit, getClientIP } from "@/lib/audit";

function generateCardNumber(): string {
  const chars = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `DH-${code}`;
}

// GET: two modes.
//   • q present (min 2 chars) → autocomplete search, returns Card[] (used by front-desk)
//   • q absent                → inventory mode, returns { cards: Card[] (with activity), stats }
export async function GET(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;
  const { searchParams } = new URL(request.url);
  const hospitalCode = searchParams.get("hospitalCode");
  const q = searchParams.get("q");

  if (!hospitalCode) return Response.json({ error: "hospitalCode required" }, { status: 400 });

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  // ── Autocomplete search (back-compat shape) ──
  if (q && q.length >= 2) {
    const searchTerm = q.trim();
    const cards = await db.patientCard.findMany({
      where: {
        hospitalId: hospital.id,
        OR: [
          { cardNumber: { startsWith: searchTerm.toUpperCase() } },
          { phone: { contains: searchTerm } },
          { patientName: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      take: 10,
      orderBy: { updatedAt: "desc" },
    });
    return Response.json(cards);
  }

  // ── Inventory mode: full list + activity + stats ──
  const cards = await db.patientCard.findMany({
    where: { hospitalId: hospital.id },
    orderBy: { createdAt: "desc" },
  });

  // Activity rolled up by phone (the only link between card + patient_record)
  const activity = await db.$queryRawUnsafe<Array<{ phone: string; visits: bigint; last_visit: Date }>>(
    `
    SELECT patient->>'phone' AS phone,
           COUNT(*) AS visits,
           MAX(created_at) AS last_visit
      FROM patient_records
     WHERE hospital_id = $1
       AND patient->>'phone' IS NOT NULL
  GROUP BY patient->>'phone'
  `,
    hospital.id,
  );
  const byPhone = new Map(activity.map((a) => [a.phone, a]));

  const enriched = cards.map((c) => {
    const a = c.phone ? byPhone.get(c.phone) : undefined;
    return {
      ...c,
      totalVisits: a ? Number(a.visits) : 0,
      lastVisit: a ? a.last_visit.toISOString() : null,
    };
  });

  // Stats
  const now = Date.now();
  const oneWeekAgo = new Date(now - 7 * 24 * 3600 * 1000);
  const oneMonthAgo = new Date(now - 30 * 24 * 3600 * 1000);
  const activeThisMonthPhones = new Set(
    activity.filter((a) => new Date(a.last_visit) >= oneMonthAgo).map((a) => a.phone),
  );
  const stats = {
    total: cards.length,
    newThisWeek: cards.filter((c) => new Date(c.createdAt) >= oneWeekAgo).length,
    activeThisMonth: cards.filter((c) => c.phone && activeThisMonthPhones.has(c.phone)).length,
    withInsurance: cards.filter((c) => c.insuranceProvider).length,
  };

  return Response.json({ cards: enriched, stats });
}

// POST: Create new patient card
export async function POST(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;
  const body = await request.json();
  const { hospitalCode, patientName, dateOfBirth, phone, gender, bloodType, allergies, insuranceProvider, insuranceId, emergencyContact, emergencyContactPhone, createdBy } = body;

  if (!hospitalCode || !patientName) return Response.json({ error: "hospitalCode and patientName required" }, { status: 400 });

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  // Generate unique card number with retry
  let cardNumber = generateCardNumber();
  let attempts = 0;
  while (attempts < 5) {
    const existing = await db.patientCard.findUnique({ where: { cardNumber } });
    if (!existing) break;
    cardNumber = generateCardNumber();
    attempts++;
  }

  const card = await db.patientCard.create({
    data: {
      cardNumber,
      hospitalId: hospital.id,
      patientName,
      dateOfBirth: dateOfBirth || null,
      phone: phone || null,
      gender: gender || null,
      bloodType: bloodType || null,
      allergies: allergies || null,
      insuranceProvider: insuranceProvider || null,
      insuranceId: insuranceId || null,
      emergencyContact: emergencyContact || null,
      emergencyContactPhone: emergencyContactPhone || null,
    },
  });

  await logAudit({
    actorType: "device_operator",
    actorId: createdBy || "front_desk",
    hospitalId: hospital.id,
    action: "patient_card.created",
    metadata: { cardNumber, patientName },
    ipAddress: getClientIP(request),
  });

  return Response.json(card, { status: 201 });
}

// PATCH: Update card details
export async function PATCH(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;
  const body = await request.json();
  const { cardNumber, ...updates } = body;

  if (!cardNumber) return Response.json({ error: "cardNumber required" }, { status: 400 });

  const card = await db.patientCard.findUnique({ where: { cardNumber } });
  if (!card) return Response.json({ error: "Card not found" }, { status: 404 });

  const allowedFields = ["patientName", "dateOfBirth", "phone", "gender", "bloodType", "allergies", "insuranceProvider", "insuranceId", "emergencyContact", "emergencyContactPhone"];
  const data: Record<string, string | null> = {};
  for (const key of allowedFields) {
    if (key in updates) data[key] = updates[key] || null;
  }

  const updated = await db.patientCard.update({ where: { cardNumber }, data });

  return Response.json(updated);
}
