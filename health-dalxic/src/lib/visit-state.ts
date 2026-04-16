/**
 * Visit state machine — single source of truth for a visit's lifecycle.
 *
 * Replaces the implicit state comment at the top of api/visit/route.ts with
 * a typed enum + transition graph. Any API route mutating visit.status should
 * go through `transitionVisitState()` so invalid transitions fail loudly
 * instead of quietly corrupting the lifecycle.
 *
 * States:
 *   queued                 → front_desk registered, in waiting room
 *   with_doctor            → doctor pulled patient into consultation
 *   paused_for_lab         → doctor sent to lab, awaiting results
 *   paused_for_imaging     → doctor sent to imaging, awaiting report
 *   paused_for_pharmacy    → doctor prescribed, awaiting dispensation
 *   paused_for_procedure   → doctor sent for procedure (injection, minor op)
 *   awaiting_close         → doctor finished, visit flagged for billing close
 *   closed                 → billed & checked out
 *   admitted               → admitted to ward/ICU (visit handed off)
 *   lwbs                   → left without being seen (kiosk escape + audit)
 *   deceased               → flagged deceased during visit
 */

export const VISIT_STATES = [
  "active",
  "queued",
  "with_doctor",
  "paused_for_lab",
  "lab_results_ready",
  "paused_for_imaging",
  "paused_for_pharmacy",
  "paused_for_procedure",
  "awaiting_close",
  "closed",
  "admitted",
  "lwbs",
  "deceased",
] as const;

export type VisitState = (typeof VISIT_STATES)[number];

export const TERMINAL_STATES: ReadonlySet<VisitState> = new Set<VisitState>([
  "closed",
  "admitted",
  "lwbs",
  "deceased",
]);

/** Allowed transitions. If (from → to) is not listed here, it is rejected. */
const TRANSITIONS: Record<VisitState, readonly VisitState[]> = {
  active: [
    "with_doctor",
    "paused_for_lab",
    "paused_for_imaging",
    "paused_for_pharmacy",
    "paused_for_procedure",
    "awaiting_close",
    "admitted",
    "lwbs",
    "deceased",
  ],
  // queued is the real start state after front-desk registration. No API
  // explicitly transitions queued → active, so queued must forward to every
  // state active can reach. Includes `closed` for direct-treatment walk-ins
  // that get a nurse supply + PIN checkout with no doctor consult.
  queued: [
    "active",
    "with_doctor",
    "paused_for_lab",
    "paused_for_imaging",
    "paused_for_pharmacy",
    "paused_for_procedure",
    "awaiting_close",
    "closed",
    "admitted",
    "lwbs",
    "deceased",
  ],
  with_doctor: [
    "paused_for_lab",
    "paused_for_imaging",
    "paused_for_pharmacy",
    "paused_for_procedure",
    "awaiting_close",
    "admitted",
    "deceased",
  ],
  paused_for_lab: ["lab_results_ready", "active", "with_doctor", "deceased"],
  // lab_results_ready is a "returning to doctor" state. Same forward semantics
  // as queued — doctor can now send to pharmacy, imaging, procedure, etc.
  lab_results_ready: [
    "active",
    "with_doctor",
    "paused_for_lab",
    "paused_for_imaging",
    "paused_for_pharmacy",
    "paused_for_procedure",
    "awaiting_close",
    "admitted",
    "deceased",
  ],
  paused_for_imaging: ["active", "with_doctor", "deceased"],
  paused_for_pharmacy: ["active", "with_doctor", "awaiting_close", "deceased"],
  paused_for_procedure: ["active", "with_doctor", "awaiting_close", "deceased"],
  awaiting_close: ["closed", "active", "with_doctor", "deceased"],
  closed: [],
  admitted: ["closed", "deceased"],
  lwbs: [],
  deceased: [],
};

export function isValidTransition(from: VisitState, to: VisitState): boolean {
  if (from === to) return false;
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function isValidVisitState(value: unknown): value is VisitState {
  return typeof value === "string" && (VISIT_STATES as readonly string[]).includes(value);
}

export function isTerminal(state: VisitState): boolean {
  return TERMINAL_STATES.has(state);
}

export function assertVisitState(value: unknown): VisitState {
  if (typeof value === "string" && (VISIT_STATES as readonly string[]).includes(value)) {
    return value as VisitState;
  }
  throw new Error(`Invalid visit state: ${String(value)}`);
}

export class InvalidVisitTransitionError extends Error {
  constructor(public readonly from: VisitState, public readonly to: VisitState) {
    super(`Invalid visit transition: ${from} → ${to}`);
    this.name = "InvalidVisitTransitionError";
  }
}

/**
 * Guarded transition. Throws InvalidVisitTransitionError on invalid (from → to).
 * Returns the target state so it can flow into the DB update inline.
 *
 * Example:
 *   const next = transitionVisitState(visit.status, "paused_for_lab");
 *   await db.visit.update({ where: { id }, data: { status: next } });
 */
export function transitionVisitState(from: VisitState | string, to: VisitState | string): VisitState {
  const f = assertVisitState(from);
  const t = assertVisitState(to);
  if (!isValidTransition(f, t)) throw new InvalidVisitTransitionError(f, t);
  return t;
}

/** Convenience: describe what states can follow a given one. For UI hints. */
export function allowedNext(from: VisitState): readonly VisitState[] {
  return TRANSITIONS[from] ?? [];
}
