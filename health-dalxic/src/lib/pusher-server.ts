import Pusher from "pusher";

let pusherInstance: Pusher | null = null;

export function getPusher(): Pusher {
  if (!pusherInstance) {
    pusherInstance = new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      useTLS: true,
    });
  }
  return pusherInstance;
}

// Channel naming: private-hospital-{code}-queue, private-hospital-{code}-lab, etc.
// Private prefix requires auth via /api/pusher endpoint
export function hospitalChannel(hospitalCode: string, suffix: string) {
  return `private-hospital-${hospitalCode}-${suffix}`;
}
