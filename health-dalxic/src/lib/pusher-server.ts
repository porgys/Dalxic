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

// Channel naming: hospital-{code}-queue, hospital-{code}-lab, etc.
export function hospitalChannel(hospitalCode: string, suffix: string) {
  return `hospital-${hospitalCode}-${suffix}`;
}

// Group-level channels for multi-branch events
export function groupChannel(groupCode: string, suffix?: string) {
  return suffix ? `private-group-${groupCode}-${suffix}` : `private-group-${groupCode}`;
}
