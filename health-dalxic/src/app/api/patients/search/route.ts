import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

// GET: Search patients within a single hospital
export async function GET(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;
  const { searchParams } = new URL(request.url);
  const hospitalCode = searchParams.get("hospitalCode");
  const q = searchParams.get("q");

  if (!hospitalCode || !q || q.length < 2) {
    return Response.json({ error: "hospitalCode and q (min 2 chars) required" }, { status: 400 });
  }

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  const searchTerm = q.trim();

  // Search across patient JSON fields and queue token using raw SQL for JSON search
  const records = await db.patientRecord.findMany({
    where: {
      hospitalId: hospital.id,
      OR: [
        { patient: { path: ["fullName"], string_contains: searchTerm } },
        { patient: { path: ["phone"], string_contains: searchTerm } },
        { patient: { path: ["insuranceId"], string_contains: searchTerm } },
        { visit: { path: ["queueToken"], string_contains: searchTerm.toUpperCase() } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const results = records.map((r) => {
    const patient = r.patient as { fullName?: string; phone?: string; gender?: string; dateOfBirth?: string; insuranceId?: string };
    const visit = r.visit as { queueToken?: string; department?: string; visitStatus?: string; status?: string };
    return {
      id: r.id,
      token: visit.queueToken ?? null,
      patientName: patient.fullName ?? "Unknown",
      phone: patient.phone ?? null,
      gender: patient.gender ?? null,
      dateOfBirth: patient.dateOfBirth ?? null,
      insuranceId: patient.insuranceId ?? null,
      visitStatus: visit.visitStatus ?? visit.status ?? "active",
      department: visit.department ?? null,
      createdAt: r.createdAt,
    };
  });

  return Response.json({ results, total: results.length });
}
