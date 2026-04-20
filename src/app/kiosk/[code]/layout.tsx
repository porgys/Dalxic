"use client"

import { KioskFrame } from "@/components/workspace/KioskFrame"

export default function KioskLayout({ children }: { children: React.ReactNode }) {
  return <KioskFrame>{children}</KioskFrame>
}
