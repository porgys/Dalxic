import { db } from "@/lib/db";
import { getPusher, hospitalChannel } from "@/lib/pusher-server";
import { rateLimit } from "@/lib/rate-limit";

// GET: Fetch chat data — messages, conversations, online staff
export async function GET(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;
  const { searchParams } = new URL(request.url);
  const hospitalCode = searchParams.get("hospitalCode");
  const module = searchParams.get("module");
  const view = searchParams.get("view") || "messages"; // "messages" | "conversations" | "staff"
  const withOperator = searchParams.get("withOperator"); // filter messages to/from specific operator
  const limit = parseInt(searchParams.get("limit") || "80");

  if (!hospitalCode || !module) {
    return Response.json({ error: "hospitalCode and module required" }, { status: 400 });
  }

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  // ── Staff list (all active operators at this hospital) ──
  if (view === "staff") {
    const operators = await db.deviceOperator.findMany({
      where: { hospitalId: hospital.id, isActive: true },
      select: { id: true, name: true, role: true, lastLoginAt: true },
      orderBy: { lastLoginAt: "desc" },
    });

    // Consider "online" if logged in within last 30 minutes
    const onlineThreshold = new Date(Date.now() - 30 * 60 * 1000);
    const staff = operators.map(op => ({
      id: op.id,
      name: op.name,
      role: op.role,
      online: op.lastLoginAt ? op.lastLoginAt > onlineThreshold : false,
      lastSeen: op.lastLoginAt,
    }));

    return Response.json({ staff });
  }

  // ── Conversation list (unique contacts with last message) ──
  if (view === "conversations") {
    const allMessages = await db.chatMessage.findMany({
      where: {
        hospitalId: hospital.id,
        OR: [
          { fromModule: module },
          { toModule: module },
          { toModule: null },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    // Group by conversation partner (operatorId)
    const convMap = new Map<string, {
      operatorId: string;
      operatorName: string;
      module: string;
      lastMessage: string;
      lastTime: string;
      unread: number;
    }>();

    allMessages.forEach(msg => {
      const isFromMe = msg.fromModule === module;
      const partnerId = isFromMe ? (msg.toModule || "broadcast") : msg.fromOperatorId;
      const partnerName = isFromMe ? (msg.toModule ? msg.toModule : "All Stations") : msg.fromOperatorName;
      const partnerModule = isFromMe ? (msg.toModule || "broadcast") : msg.fromModule;

      if (!convMap.has(partnerId)) {
        convMap.set(partnerId, {
          operatorId: partnerId,
          operatorName: partnerName,
          module: partnerModule,
          lastMessage: msg.message,
          lastTime: msg.createdAt.toISOString(),
          unread: 0,
        });
      }

      // Count unread from this partner
      if (!isFromMe && !msg.isRead) {
        const conv = convMap.get(partnerId)!;
        conv.unread += 1;
      }
    });

    return Response.json({
      conversations: Array.from(convMap.values()),
    });
  }

  // ── Messages (optionally filtered by conversation partner) ──
  const whereClause: Record<string, unknown> = { hospitalId: hospital.id };

  if (withOperator) {
    // Direct conversation with a specific operator
    whereClause.OR = [
      { fromOperatorId: withOperator, OR: [{ toModule: module }, { toModule: null }] },
      { fromModule: module, toModule: withOperator },
    ];
  } else {
    whereClause.OR = [
      { toModule: module },
      { toModule: null },
      { fromModule: module },
    ];
  }

  const messages = await db.chatMessage.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const unread = await db.chatMessage.count({
    where: {
      hospitalId: hospital.id,
      isRead: false,
      fromModule: { not: module },
      OR: [{ toModule: module }, { toModule: null }],
    },
  });

  return Response.json({ messages: messages.reverse(), unread });
}

// POST: Send a chat message
export async function POST(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;
  const body = await request.json();
  const { hospitalCode, fromModule, toModule, fromOperatorId, fromOperatorName, message } = body;

  if (!hospitalCode || !fromModule || !fromOperatorId || !fromOperatorName || !message?.trim()) {
    return Response.json({ error: "hospitalCode, fromModule, fromOperatorId, fromOperatorName, message required" }, { status: 400 });
  }

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  const msg = await db.chatMessage.create({
    data: {
      hospitalId: hospital.id,
      fromModule,
      toModule: toModule || null,
      fromOperatorId,
      fromOperatorName,
      message: message.trim(),
    },
  });

  // Broadcast via Pusher
  try {
    const pusher = getPusher();
    await pusher.trigger(hospitalChannel(hospitalCode, "chat"), "new-message", {
      id: msg.id,
      fromModule: msg.fromModule,
      toModule: msg.toModule,
      fromOperatorId: msg.fromOperatorId,
      fromOperatorName: msg.fromOperatorName,
      message: msg.message,
      createdAt: msg.createdAt,
    });
  } catch { /* Pusher non-blocking */ }

  return Response.json(msg, { status: 201 });
}

// PATCH: Mark messages as read
export async function PATCH(request: Request) {
  const blocked = rateLimit(request); if (blocked) return blocked;
  const body = await request.json();
  const { hospitalCode, module, fromOperatorId } = body;

  if (!hospitalCode || !module) {
    return Response.json({ error: "hospitalCode and module required" }, { status: 400 });
  }

  const hospital = await db.hospital.findUnique({ where: { code: hospitalCode } });
  if (!hospital) return Response.json({ error: "Hospital not found" }, { status: 404 });

  const readWhere: Record<string, unknown> = {
    hospitalId: hospital.id,
    isRead: false,
    fromModule: { not: module },
    OR: [{ toModule: module }, { toModule: null }],
  };

  // Optionally scope to specific sender
  if (fromOperatorId) {
    readWhere.fromOperatorId = fromOperatorId;
  }

  await db.chatMessage.updateMany({
    where: readWhere,
    data: { isRead: true },
  });

  return Response.json({ ok: true });
}
