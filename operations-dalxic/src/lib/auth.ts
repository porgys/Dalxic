import { db } from "@/lib/db";

interface AuthResult {
  operatorId: string;
  orgId: string;
  orgCode: string;
  role: string;
}

/**
 * Authenticate an API request. Returns operator info or a 401/403 Response.
 *
 * Usage at top of any route handler:
 *   const auth = await authenticateRequest(request);
 *   if (auth instanceof Response) return auth;
 *   // auth.operatorId, auth.orgId, auth.role now available
 */
export async function authenticateRequest(request: Request): Promise<AuthResult | Response> {
  const operatorId = request.headers.get("x-operator-id");
  const orgCode = request.headers.get("x-org-code");

  if (!operatorId || !orgCode) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  // Master access bypass (from PIN login)
  if (operatorId === "master_access") {
    const org = await db.organization.findUnique({ where: { code: orgCode } });
    if (!org || !org.active) {
      return Response.json({ error: "Organization not found" }, { status: 404 });
    }
    return { operatorId: "master_access", orgId: org.id, orgCode: org.code, role: "super_admin" };
  }

  // Normal operator validation
  const operator = await db.operator.findUnique({
    where: { id: operatorId },
    include: { org: true },
  });

  if (!operator || !operator.isActive) {
    return Response.json({ error: "Invalid or inactive operator" }, { status: 401 });
  }

  if (operator.org.code !== orgCode || !operator.org.active) {
    return Response.json({ error: "Access denied" }, { status: 403 });
  }

  return {
    operatorId: operator.id,
    orgId: operator.orgId,
    orgCode: operator.org.code,
    role: operator.role,
  };
}

/** Role-based access check */
export function requireRole(auth: AuthResult, allowedRoles: string[]): Response | null {
  if (auth.role === "super_admin") return null; // master_access can do anything
  if (!allowedRoles.includes(auth.role)) {
    return Response.json({ error: "Insufficient permissions" }, { status: 403 });
  }
  return null;
}
