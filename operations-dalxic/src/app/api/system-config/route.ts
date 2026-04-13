import { db } from "@/lib/db";
import { rateLimit, AUTH_RATE_LIMIT } from "@/lib/rate-limit";

/**
 * System config — key-value store for master PIN, feature flags, etc.
 *
 * GET:  Read a config value by key
 * POST: Set a config value (upsert)
 */

export async function GET(request: Request) {
  const blocked = rateLimit(request, AUTH_RATE_LIMIT);
  if (blocked) return blocked;

  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (!key) return Response.json({ error: "key required" }, { status: 400 });

  const config = await db.systemConfig.findUnique({ where: { key } });
  if (!config) return Response.json({ error: "Config not found" }, { status: 404 });

  return Response.json({ key: config.key, value: config.value, updatedAt: config.updatedAt });
}

export async function POST(request: Request) {
  const blocked = rateLimit(request, AUTH_RATE_LIMIT);
  if (blocked) return blocked;

  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key?.trim() || value === undefined || value === null) {
      return Response.json({ error: "key and value required" }, { status: 400 });
    }

    const config = await db.systemConfig.upsert({
      where: { key: key.trim() },
      update: { value: String(value) },
      create: { key: key.trim(), value: String(value) },
    });

    return Response.json({ key: config.key, value: config.value, updatedAt: config.updatedAt });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[system-config] POST error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
