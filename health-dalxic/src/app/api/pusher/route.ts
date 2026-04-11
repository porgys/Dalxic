import { getPusher } from "@/lib/pusher-server";
import { rateLimit, AUTH_RATE_LIMIT } from "@/lib/rate-limit";

/**
 * Pusher channel authentication endpoint.
 * Only authenticated users with a valid dalxic_access cookie
 * can subscribe to private hospital channels.
 *
 * Pusher sends: socket_id + channel_name
 * We verify the cookie, then return an auth signature.
 */
export async function POST(request: Request) {
  const blocked = rateLimit(request, AUTH_RATE_LIMIT);
  if (blocked) return blocked;

  // Verify dalxic access cookie (skip on localhost for dev)
  const host = request.headers.get("host") || "";
  if (!host.includes("localhost")) {
    const cookie = request.headers.get("cookie") ?? "";
    const hasAccess = cookie.split(";").some(c =>
      c.trim().startsWith("dalxic_access=") && c.trim().endsWith("granted")
    );
    if (!hasAccess) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }
  }

  const body = await request.formData();
  const socketId = body.get("socket_id") as string;
  const channelName = body.get("channel_name") as string;

  if (!socketId || !channelName) {
    return Response.json({ error: "socket_id and channel_name required" }, { status: 400 });
  }

  // Only allow private-hospital-* channels
  if (!channelName.startsWith("private-hospital-")) {
    return Response.json({ error: "Invalid channel" }, { status: 403 });
  }

  const pusher = getPusher();
  const auth = pusher.authorizeChannel(socketId, channelName);

  return Response.json(auth);
}
