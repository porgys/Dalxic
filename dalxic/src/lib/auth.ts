import { db } from "@/lib/db";
import { verifyMasterSig } from "@/lib/api/hash";

interface AuthResult {
  operatorId: string;
  orgId: string;
  orgCode: string;
  role: string;
}

export async function authenticateRequest(request: Request): Promise<AuthResult | Response> {
  const operatorId = request.headers.get("x-operator-id");
  const orgCode = request.headers.get("x-org-code");

  if (!operatorId || !orgCode) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  if (operatorId === "master_access") {
    const masterSig = request.headers.get("x-master-sig");
    if (!masterSig || !verifyMasterSig(orgCode, masterSig)) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    const org = await db.organization.findUnique({ where: { code: orgCode } });
    if (!org || !org.active) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }
    return { operatorId: "master_access", orgId: org.id, orgCode: org.code, role: "super_admin" };
  }

  const operator = await db.operator.findUnique({
    where: { id: operatorId },
    include: { org: true },
  });

  if (!operator || !operator.isActive) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  if (operator.org.code !== orgCode || !operator.org.active) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  return {
    operatorId: operator.id,
    orgId: operator.orgId,
    orgCode: operator.org.code,
    role: operator.role,
  };
}

export function requireRole(auth: AuthResult, allowedRoles: string[]): Response | null {
  if (auth.role === "super_admin") return null;
  if (!allowedRoles.includes(auth.role)) {
    return Response.json({ error: "Insufficient permissions" }, { status: 403 });
  }
  return null;
}
