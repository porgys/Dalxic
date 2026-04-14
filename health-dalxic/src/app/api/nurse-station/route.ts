import { db } from "@/lib/db";
import { logAudit, getClientIP } from "@/lib/audit";
import { createBillableItem } from "@/lib/billing";
import { rateLimit } from "@/lib/rate-limit";
// GET: Get patients with nursing tasks for today
export async function GET(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;  const { searchParams } = new URL(request.url);
  const hospitalCode = searchParams.get("hospitalCode");
  const view = searchParams.get("view"); // "active" | "vitals" | "tasks"

  if (!hospitalCode) {
    return Response.json({ error: "hospitalCode required" }, { status: 400 });
  }

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  const records = await db.patientRecord.findMany({
    where: { hospitalId: hospital.id },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  type VitalEntry = {
    id: string;
    timestamp: string;
    temperature?: number;
    bloodPressure?: string;
    pulse?: number;
    respRate?: number;
    spO2?: number;
    weight?: number;
    height?: number;
    bmi?: number;
    recordedBy: string;
    notes?: string;
  };

  type NursingTask = {
    id: string;
    type: string;
    description: string;
    status: string;
    assignedTo?: string;
    completedBy?: string;
    completedAt?: string;
    dueAt?: string;
    notes?: string;
  };

  const patients = records.map((r) => {
    const patient = r.patient as { fullName: string; age?: number; gender?: string };
    const visit = r.visit as { queueToken: string; department: string; assignedDoctor?: string; chiefComplaint?: string; entryPoint?: string };
    const treatment = r.treatment as { vitals?: VitalEntry[]; nursingTasks?: NursingTask[]; injectionOrders?: unknown[]; nurseSupplies?: unknown[] };

    const vitals = treatment.vitals || [];
    const tasks = treatment.nursingTasks || [];
    const injections = (treatment.injectionOrders || []) as Array<{ status: string }>;
    const supplies = (treatment.nurseSupplies || []) as Array<{ drugName: string; quantity: number; administeredAt: string }>;

    return {
      recordId: r.id,
      patientName: patient.fullName,
      age: patient.age,
      gender: patient.gender,
      queueToken: visit.queueToken,
      department: visit.department,
      assignedDoctor: visit.assignedDoctor,
      chiefComplaint: visit.chiefComplaint,
      entryPoint: visit.entryPoint || r.entryPoint || "front_desk",
      isDirectTreatment: (visit.entryPoint || r.entryPoint) === "direct_treatment",
      latestVitals: vitals.length > 0 ? vitals[vitals.length - 1] : null,
      vitalsCount: vitals.length,
      pendingTasks: tasks.filter((t) => t.status === "pending").length,
      completedTasks: tasks.filter((t) => t.status === "completed").length,
      pendingInjections: injections.filter((i) => i.status === "pending" || i.status === "in_progress").length,
      suppliesCount: supplies.length,
      tasks,
      createdAt: r.createdAt,
    };
  });

  // Filter based on view
  if (view === "vitals") {
    return Response.json(patients.map((p) => ({ recordId: p.recordId, patientName: p.patientName, queueToken: p.queueToken, latestVitals: p.latestVitals, vitalsCount: p.vitalsCount })));
  }

  if (view === "tasks") {
    const withTasks = patients.filter((p) => p.pendingTasks > 0 || p.pendingInjections > 0);
    return Response.json(withTasks);
  }

  // Summary counts
  const counts = {
    totalPatients: patients.length,
    needsVitals: patients.filter((p) => p.vitalsCount === 0).length,
    pendingTasks: patients.reduce((s, p) => s + p.pendingTasks, 0),
    pendingInjections: patients.reduce((s, p) => s + p.pendingInjections, 0),
  };

  return Response.json({ patients, counts });
}

// POST: Record vitals or manage nursing tasks
export async function POST(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;  const body = await request.json();
  const { hospitalCode, action } = body;

  if (!hospitalCode || !action) {
    return Response.json({ error: "hospitalCode and action required" }, { status: 400 });
  }

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  // Record vitals
  if (action === "record_vitals") {
    const { recordId, temperature, bloodPressure, pulse, respRate, spO2, weight, height, recordedBy, notes } = body;
    if (!recordId) return Response.json({ error: "recordId required" }, { status: 400 });

    const record = await db.patientRecord.findUnique({ where: { id: recordId } });
    if (!record) return Response.json({ error: "Record not found" }, { status: 404 });

    const treatment = record.treatment as { vitals?: unknown[]; [key: string]: unknown };
    const vitals = treatment.vitals || [];

    const bmi = weight && height ? Math.round((weight / ((height / 100) ** 2)) * 10) / 10 : undefined;

    const entry = {
      id: `VIT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      temperature: temperature || undefined,
      bloodPressure: bloodPressure || undefined,
      pulse: pulse || undefined,
      respRate: respRate || undefined,
      spO2: spO2 || undefined,
      weight: weight || undefined,
      height: height || undefined,
      bmi,
      recordedBy: recordedBy || "nurse",
      notes: notes || undefined,
    };

    vitals.push(entry);

    await db.patientRecord.update({
      where: { id: recordId },
      data: { treatment: JSON.parse(JSON.stringify({ ...treatment, vitals })) },
    });

    await logAudit({
      actorType: "device_operator",
      actorId: recordedBy || "nurse",
      hospitalId: hospital.id,
      action: "vitals.recorded",
      metadata: { recordId, temperature, bloodPressure, pulse, spO2 },
      ipAddress: getClientIP(request),
    });

    return Response.json(entry, { status: 201 });
  }

  // Add nursing task
  if (action === "add_task") {
    const { recordId, type, description, assignedTo, dueAt } = body;
    if (!recordId || !type || !description) {
      return Response.json({ error: "recordId, type, description required" }, { status: 400 });
    }

    const record = await db.patientRecord.findUnique({ where: { id: recordId } });
    if (!record) return Response.json({ error: "Record not found" }, { status: 404 });

    const treatment = record.treatment as { nursingTasks?: unknown[]; [key: string]: unknown };
    const tasks = treatment.nursingTasks || [];

    const task = {
      id: `TASK-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      description,
      status: "pending",
      assignedTo: assignedTo || null,
      dueAt: dueAt || null,
      notes: null,
    };

    tasks.push(task);

    await db.patientRecord.update({
      where: { id: recordId },
      data: { treatment: JSON.parse(JSON.stringify({ ...treatment, nursingTasks: tasks })) },
    });

    return Response.json(task, { status: 201 });
  }

  // Complete nursing task
  if (action === "complete_task") {
    const { recordId, taskId, completedBy, notes } = body;
    if (!recordId || !taskId) {
      return Response.json({ error: "recordId and taskId required" }, { status: 400 });
    }

    const record = await db.patientRecord.findUnique({ where: { id: recordId } });
    if (!record) return Response.json({ error: "Record not found" }, { status: 404 });

    const treatment = record.treatment as { nursingTasks?: Array<{ id: string; type: string; status: string; completedBy?: string; completedAt?: string; notes?: string }>; [key: string]: unknown };
    const tasks = treatment.nursingTasks || [];
    const idx = tasks.findIndex((t) => t.id === taskId);
    if (idx === -1) return Response.json({ error: "Task not found" }, { status: 404 });

    tasks[idx].status = "completed";
    tasks[idx].completedBy = completedBy || "nurse";
    tasks[idx].completedAt = new Date().toISOString();
    if (notes) tasks[idx].notes = notes;

    await db.patientRecord.update({
      where: { id: recordId },
      data: { treatment: JSON.parse(JSON.stringify({ ...treatment, nursingTasks: tasks })) },
    });

    await logAudit({
      actorType: "device_operator",
      actorId: completedBy || "nurse",
      hospitalId: hospital.id,
      action: "nursing.task_completed",
      metadata: { recordId, taskId, type: tasks[idx].type },
      ipAddress: getClientIP(request),
    });

    return Response.json({ success: true, task: tasks[idx] });
  }

  // Add supply — nurse administers pharmacy items (syringe, dressing, IV line, injection drug, etc.)
  // Auto-decrements pharmacy stock via FEFO and creates billableItems (one per supply).
  if (action === "add_supply") {
    const { recordId, items, administeredBy } = body as {
      recordId: string;
      items: Array<{ drugCatalogId: string; quantity: number; notes?: string }>;
      administeredBy?: string;
    };

    if (!recordId || !Array.isArray(items) || items.length === 0) {
      return Response.json({ error: "recordId and items[] required" }, { status: 400 });
    }

    const record = await db.patientRecord.findUnique({ where: { id: recordId } });
    if (!record) return Response.json({ error: "Record not found" }, { status: 404 });

    const now = new Date();
    const operator = administeredBy || "nurse";

    // Ensure active monthly book exists for billable item attachment
    const book = await db.monthlyBook.findFirst({
      where: { hospitalId: hospital.id, year: now.getFullYear(), month: now.getMonth() + 1, status: "active" },
    });
    if (!book) return Response.json({ error: "No active monthly book — cannot bill" }, { status: 409 });

    const treatment = record.treatment as { nurseSupplies?: unknown[]; [key: string]: unknown };
    const supplyLog = (treatment.nurseSupplies || []) as Array<{
      id: string; drugCatalogId: string; drugName: string; quantity: number;
      unitCost: number; totalCost: number; batchId: string | null;
      administeredBy: string; administeredAt: string; notes?: string; billableItemId: string | null;
    }>;

    const results: Array<{
      drugCatalogId: string; drugName: string; requestedQty: number; dispensedQty: number;
      unitCost: number; totalCost: number; success: boolean; reason?: string;
    }> = [];

    for (const item of items) {
      const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
      const drug = await db.drugCatalog.findFirst({
        where: { id: item.drugCatalogId, hospitalId: hospital.id, isActive: true },
      });
      if (!drug) {
        results.push({ drugCatalogId: item.drugCatalogId, drugName: "Unknown", requestedQty: qty, dispensedQty: 0, unitCost: 0, totalCost: 0, success: false, reason: "Drug not found" });
        continue;
      }

      // FEFO: earliest-expiring batch with stock
      const batch = await db.drugStock.findFirst({
        where: { drugCatalogId: drug.id, hospitalId: hospital.id, status: "ACTIVE", quantityRemaining: { gt: 0 } },
        orderBy: { expiryDate: "asc" },
      });

      if (!batch) {
        results.push({ drugCatalogId: drug.id, drugName: drug.name, requestedQty: qty, dispensedQty: 0, unitCost: drug.defaultPrice, totalCost: 0, success: false, reason: "Out of stock" });
        continue;
      }

      const deductQty = Math.min(qty, batch.quantityRemaining);
      const newRemaining = batch.quantityRemaining - deductQty;
      const unitCost = batch.sellPrice;
      const totalCost = unitCost * deductQty;

      await db.drugStock.update({
        where: { id: batch.id },
        data: { quantityRemaining: newRemaining, status: newRemaining === 0 ? "DEPLETED" : "ACTIVE" },
      });

      await db.stockMovement.create({
        data: {
          hospitalId: hospital.id, drugStockId: batch.id, drugCatalogId: drug.id,
          type: "DISPENSED_HOSPITAL", quantity: deductQty,
          balanceBefore: batch.quantityRemaining, balanceAfter: newRemaining,
          reference: recordId, performedBy: operator,
          notes: `Nurse supply: ${drug.name} × ${deductQty}${item.notes ? ` — ${item.notes}` : ""}`,
        },
      });

      const billable = await createBillableItem({
        hospitalId: hospital.id,
        patientId: recordId,
        bookId: book.id,
        serviceType: "DRUG",
        description: `Nurse: ${drug.name} × ${deductQty} ${drug.unit}`,
        unitCost,
        quantity: deductQty,
        renderedBy: operator,
        departmentId: "nursing",
        overrideUnitCost: unitCost,
      });

      supplyLog.push({
        id: `SUP-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        drugCatalogId: drug.id,
        drugName: drug.name,
        quantity: deductQty,
        unitCost,
        totalCost,
        batchId: batch.id,
        administeredBy: operator,
        administeredAt: now.toISOString(),
        notes: item.notes,
        billableItemId: billable.id,
      });

      results.push({ drugCatalogId: drug.id, drugName: drug.name, requestedQty: qty, dispensedQty: deductQty, unitCost, totalCost, success: true });
    }

    await db.patientRecord.update({
      where: { id: recordId },
      data: { treatment: JSON.parse(JSON.stringify({ ...treatment, nurseSupplies: supplyLog })) },
    });

    await logAudit({
      actorType: "device_operator",
      actorId: operator,
      hospitalId: hospital.id,
      action: "nurse.supply_administered",
      metadata: { recordId, itemCount: items.length, results },
      ipAddress: getClientIP(request),
    });

    const grandTotal = results.filter((r) => r.success).reduce((s, r) => s + r.totalCost, 0);
    return Response.json({ success: true, results, grandTotal }, { status: 201 });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}
