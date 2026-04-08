import { db } from "@/lib/db";
import { generateAISummary } from "@/lib/ai-summary";

// POST: Generate AI summary for a patient record
export async function POST(request: Request) {
  const body = await request.json();
  const { recordId } = body;

  if (!recordId) {
    return Response.json({ error: "recordId required" }, { status: 400 });
  }

  const record = await db.patientRecord.findUnique({
    where: { id: recordId },
  });

  if (!record) {
    return Response.json({ error: "Record not found" }, { status: 404 });
  }

  // Fetch any lab results
  const labResults = await db.labResult.findMany({
    where: { patientId: recordId },
  });

  try {
    const summary = await generateAISummary({
      patient: record.patient,
      visit: record.visit,
      diagnosis: record.diagnosis,
      treatment: record.treatment,
      lab: labResults.length > 0 ? labResults : null,
    });

    // Save summary to record
    await db.patientRecord.update({
      where: { id: recordId },
      data: { aiSummary: JSON.parse(JSON.stringify(summary)) },
    });

    return Response.json(summary);
  } catch {
    // AI unavailable (no API key, network error, etc.) — continue without summary
    const fallback = { brief: "AI summary unavailable", clinicalSummary: "Anthropic API key not configured.", riskFlags: [] };
    await db.patientRecord.update({
      where: { id: recordId },
      data: { aiSummary: JSON.parse(JSON.stringify(fallback)) },
    });
    return Response.json(fallback);
  }
}
