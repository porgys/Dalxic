/**
 * DATA PROTECTION LAYER — Dalxic Health
 *
 * This module enforces hard rules at the code level:
 *
 * 1. Hospital data (patient records, bills, inventory, lab results, etc.)
 *    can NEVER be deleted by any staff role or API call.
 *
 * 2. Only the platform Owner (dalxic_super_admin via Ops portal, authenticated
 *    with the master password) can suspend or delete a hospital — and even then,
 *    records are soft-deleted (isActive = false), never hard-deleted.
 *
 * 3. Every blocked destructive attempt is logged to the audit trail.
 *
 * 4. Seed scripts must call canSeedTable() before inserting — if the table
 *    already has data for that hospital, the seed is blocked.
 *
 * These rules are NOT bypassable from the API layer. They are enforced
 * here, in a single file, so any future developer must read this file
 * and understand the consequences before touching it.
 */

import { db } from "./db";

// ─── Protected Tables ───
// These tables contain hospital operational data that must never be deleted.
// Adding a table here blocks all DELETE operations against it from the API layer.
const PROTECTED_TABLES = new Set([
  "patient_records",
  "patient_cards",
  "bills",
  "billable_items",
  "lab_orders",
  "lab_results",
  "drug_catalog",
  "drug_stock",
  "stock_movements",
  "retail_sales",
  "service_prices",
  "hospital_lab_tests",
  "blood_inventory",
  "beds",
  "rooms",
  "wards",
  "device_operators",
  "doctors",
  "monthly_books",
  "shift_handovers",
  "chat_messages",
  "audit_log",       // Audit trail is ALWAYS append-only
  "bed_transitions",
  "hospital_emergency_contacts",
]);

// ─── Guard: Block Destructive Operations ───

export interface ProtectionContext {
  actorType: string;     // "dalxic_super_admin" | "dalxic_staff" | "device_operator" | etc.
  actorId: string;
  hospitalId: string;
  ipAddress: string;
}

/**
 * Check if a destructive operation (DELETE, TRUNCATE, bulk wipe) is allowed.
 *
 * Returns { allowed: true } or { allowed: false, reason: string }.
 *
 * Rule: NO ONE can delete hospital data rows. Not staff, not admin, not super_admin.
 * The only entity that can remove a hospital entirely is the Owner via the Ops portal,
 * and even that is a soft-delete (hospital.isActive = false).
 */
export function canDeleteFrom(
  tableName: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ctx: ProtectionContext
): { allowed: boolean; reason?: string } {
  // Audit log can NEVER be deleted — no exceptions
  if (tableName === "audit_log") {
    return { allowed: false, reason: "Audit trail is immutable. No deletions permitted." };
  }

  // Protected tables: no deletions from any actor
  if (PROTECTED_TABLES.has(tableName)) {
    return {
      allowed: false,
      reason: `Table "${tableName}" is protected. Hospital data cannot be deleted. Use soft-delete (isActive=false) or status changes instead.`,
    };
  }

  // Unprotected tables (e.g. system_config for PIN resets): allow with audit
  return { allowed: true };
}

/**
 * Log a blocked destructive attempt to the audit trail.
 * This creates an immutable record of someone trying to delete protected data.
 */
export async function logBlockedDeletion(
  tableName: string,
  ctx: ProtectionContext,
  reason: string
): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        actorType: ctx.actorType,
        actorId: ctx.actorId,
        hospitalId: ctx.hospitalId,
        action: "data_protection.delete_blocked",
        metadata: {
          table: tableName,
          reason,
          timestamp: new Date().toISOString(),
        },
        ipAddress: ctx.ipAddress,
      },
    });
  } catch {
    // Audit logging should never throw and break the request
    console.error("[DATA PROTECTION] Failed to log blocked deletion:", tableName);
  }
}

// ─── Guard: Seed Safety ───

/**
 * Check if a seed/bulk-insert is safe for a given table and hospital.
 * Seeds should ONLY run on empty tables. If data already exists, the seed is blocked.
 *
 * This prevents any script (including Claude) from wiping and re-inserting data.
 */
export async function canSeedTable(
  tableName: string,
  hospitalId: string
): Promise<{ allowed: boolean; existingCount: number; reason?: string }> {
  try {
    // Use raw query since table name is dynamic
    // Validate table name against known set to prevent SQL injection
    if (!PROTECTED_TABLES.has(tableName)) {
      return { allowed: false, existingCount: -1, reason: `Unknown protected table: ${tableName}` };
    }

    const result = await db.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*) as count FROM "${tableName}" WHERE hospital_id = $1`,
      hospitalId
    );

    const count = Number(result[0]?.count ?? 0);

    if (count > 0) {
      return {
        allowed: false,
        existingCount: count,
        reason: `Table "${tableName}" already has ${count} records for hospital ${hospitalId}. Seed blocked — existing data must not be overwritten.`,
      };
    }

    return { allowed: true, existingCount: 0 };
  } catch {
    // If we can't check, block the seed to be safe
    return { allowed: false, existingCount: -1, reason: `Could not verify table "${tableName}" — seed blocked for safety.` };
  }
}

// ─── Guard: Hospital Suspension/Deletion ───

/**
 * Only the platform Owner (dalxic_super_admin) can suspend or delete a hospital.
 * Even then, this is a SOFT DELETE — hospital.isActive = false.
 * All data is preserved. The hospital simply becomes inaccessible.
 */
export function canSuspendHospital(
  ctx: ProtectionContext
): { allowed: boolean; reason?: string } {
  if (ctx.actorType !== "dalxic_super_admin") {
    return {
      allowed: false,
      reason: `Only the platform Owner (dalxic_super_admin) can suspend a hospital. Actor type "${ctx.actorType}" is not authorized.`,
    };
  }
  return { allowed: true };
}

/**
 * Hard-deleting a hospital is NEVER allowed through the API.
 * This function always returns false. A hospital can only be suspended (soft-deleted).
 * If data truly needs to be purged, it must be done via direct database access
 * by the platform owner with full audit trail.
 */
export function canHardDeleteHospital(): { allowed: false; reason: string } {
  return {
    allowed: false,
    reason: "Hard deletion of hospitals is not permitted through the application. Use suspension (isActive=false) instead. Data purge requires direct database access with full audit trail.",
  };
}
