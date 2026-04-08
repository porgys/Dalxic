import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { getPusher, hospitalChannel } from "@/lib/pusher-server";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { notifyPatient } from "@/lib/whatsapp";
import { rateLimit } from "@/lib/rate-limit";
// POST: Enter lab results
export async function POST(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;  const body = await request.json();
  const { labOrderId, results, enteredBy } = body as {
    labOrderId: string;
    results: {
      testName: string;
      resultValue: string;
      unit?: string;
      referenceRange?: string;
      flag: string;
    }[];
    enteredBy: string;
  };

  if (!labOrderId || !results?.length || !enteredBy) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const order = await db.labOrder.findUnique({
    where: { id: labOrderId },
    include: { hospital: true },
  });
  if (!order) {
    return Response.json({ error: "Lab order not found" }, { status: 404 });
  }

  // Create all results
  const created = await Promise.all(
    results.map((r) =>
      db.labResult.create({
        data: {
          labOrderId,
          patientId: order.patientId,
          testName: r.testName,
          resultValue: r.resultValue,
          unit: r.unit ?? null,
          referenceRange: r.referenceRange ?? null,
          flag: r.flag,
          enteredBy,
        },
      })
    )
  );

  // Update order status
  await db.labOrder.update({
    where: { id: labOrderId },
    data: { status: "complete" },
  });

  // Notify doctor via Pusher
  try {
    const pusher = getPusher();
    const abnormal = results.filter((r) => r.flag !== "normal");
    await pusher.trigger(hospitalChannel(order.hospital.code, "lab-results"), "results-ready", {
      labToken: order.labToken,
      patientId: order.patientId,
      testCount: results.length,
      abnormalCount: abnormal.length,
      hasAbnormal: abnormal.length > 0,
    });
  } catch {
    // Pusher not configured
  }

  await logAudit({
    actorType: "device_operator",
    actorId: enteredBy,
    hospitalId: order.hospitalId,
    action: "lab_results.entered",
    metadata: { labToken: order.labToken, resultCount: results.length },
    ipAddress: getClientIP(request),
  });

  // Auto-re-queue patient if they were paused for lab
  try {
    const patientRecord = await db.patientRecord.findUnique({ where: { id: order.patientId } });
    if (patientRecord) {
      const visit = patientRecord.visit as { visitStatus?: string; [key: string]: unknown };
      if (visit.visitStatus === "paused_for_lab") {
        // Trigger the re-queue via visit lifecycle
        const visitUrl = new URL("/api/visit", request.url);
        await fetch(visitUrl.toString(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hospitalCode: order.hospital.code, action: "lab_results_ready", recordId: order.patientId }),
        });
      }
    }
  } catch { /* non-blocking */ }

  return Response.json({ results: created }, { status: 201 });
}
