import { db } from "@/lib/db";
import { generateLabToken } from "@/lib/tokens";
import { logAudit, getClientIP } from "@/lib/audit";
import { getPusher, hospitalChannel } from "@/lib/pusher-server";
import { createBillableItem } from "@/lib/billing";

// POST: Create a lab order
export async function POST(request: Request) {
  const body = await request.json();
  const { patientId, hospitalCode, tests, customTests, clinicalNotes, orderedBy } = body;

  if (!patientId || !hospitalCode || !tests?.length) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) {
    return Response.json({ error: "Hospital not found" }, { status: 404 });
  }

  const record = await db.patientRecord.findUnique({ where: { id: patientId } });
  if (!record) {
    return Response.json({ error: "Patient record not found" }, { status: 404 });
  }

  const labToken = await generateLabToken(hospitalCode);

  const order = await db.labOrder.create({
    data: {
      patientId,
      hospitalId: hospital.id,
      bookId: record.bookId,
      orderedBy: orderedBy ?? "doctor",
      tests,
      customTests: customTests ?? null,
      clinicalNotes: clinicalNotes ?? null,
      labToken,
    },
  });

  // Emit LAB billable items for each test ordered
  const testList = tests as Array<{ testName: string; category?: string }>;
  await Promise.all(
    testList.map((t) =>
      createBillableItem({
        hospitalId: hospital.id,
        patientId,
        bookId: record.bookId,
        serviceType: "LAB",
        description: `Lab: ${t.testName}`,
        unitCost: 25, // Default lab test fee, overridden by ServicePrice if configured
        renderedBy: orderedBy ?? "doctor",
      })
    )
  );

  // Broadcast to lab station
  try {
    const pusher = getPusher();
    const patient = record.patient as { fullName?: string };
    await pusher.trigger(hospitalChannel(hospitalCode, "lab"), "new-order", {
      labToken,
      patientName: patient.fullName ?? "Unknown",
      tests,
      clinicalNotes,
      orderId: order.id,
    });
  } catch {
    // Pusher not configured
  }

  await logAudit({
    actorType: "device_operator",
    actorId: orderedBy ?? "doctor",
    hospitalId: hospital.id,
    action: "lab_order.created",
    metadata: { labToken, testCount: tests.length },
    ipAddress: getClientIP(request),
  });

  return Response.json({ labToken, orderId: order.id }, { status: 201 });
}

// GET: List lab orders for a hospital
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hospitalCode = searchParams.get("hospitalCode");
  const status = searchParams.get("status");

  if (!hospitalCode) {
    return Response.json({ error: "hospitalCode required" }, { status: 400 });
  }

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) {
    return Response.json({ error: "Hospital not found" }, { status: 404 });
  }

  const orders = await db.labOrder.findMany({
    where: {
      hospitalId: hospital.id,
      ...(status ? { status } : {}),
    },
    orderBy: { orderedAt: "desc" },
    include: { labResults: true },
  });

  return Response.json(orders);
}
