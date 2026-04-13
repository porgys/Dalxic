import { db } from "@/lib/db";
import { rateLimit, AUTH_RATE_LIMIT } from "@/lib/rate-limit";
import { authenticateRequest, requireRole } from "@/lib/auth";

/**
 * System config — key-value store for master PIN, feature flags, etc.
 *
 * GET:  Read a config value by key (super_admin only)
 * POST: Set a config value (upsert) (super_admin only)
 */

export async function GET(request: Request) {
  const blocked = rateLimit(request, AUTH_RATE_LIMIT);
  if (blocked) return blocked;

  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;

  const roleCheck = requireRole(auth, ["super_admin"]);
  if (roleCheck) return roleCheck;

  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (!key) return Response.json({ error: "key required" }, { status: 400 });

  // Block reading master_pin keys via API
  if (key.startsWith("master_pin:")) {
    return Response.json({ error: "Access denied" }, { status: 403 });
  }

  const config = await db.systemConfig.findUnique({ where: { key } });
  if (!config) return Response.json({ error: "Config not found" }, { status: 404 });

  return Response.json({ key: config.key, value: config.value, updatedAt: config.updatedAt });
}

export async function POST(request: Request) {
  const blocked = rateLimit(request, AUTH_RATE_LIMIT);
  if (blocked) return blocked;

  const auth = await authenticateRequest(request);
  if (auth instanceof Response) return auth;

  const roleCheck = requireRole(auth, ["super_admin"]);
  if (roleCheck) return roleCheck;

  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key?.trim() || value === undefined || value === null) {
      return Response.json({ error: "key and value required" }, { status: 400 });
    }

    // Block writing master_pin keys via API
    if (key.trim().startsWith("master_pin:")) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    const config = await db.systemConfig.upsert({
      where: { key: key.trim() },
      update: { value: String(value) },
      create: { key: key.trim(), value: String(value) },
    });

    return Response.json({ key: config.key, value: config.value, updatedAt: config.updatedAt });
  } catch (err: unknown) {
    console.error("API error:", err);
    return Response.json({ error: "An error occurred" }, { status: 500 });
  }
}
