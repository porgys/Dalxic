"use client"
import { HealthShell } from "@/components/ops/HealthShell"
import { HealthLaunchpad } from "@/components/ops/HealthLaunchpad"
import { useAuth } from "@/lib/use-auth"

export default function HealthPage() {
  const { session } = useAuth()
  return (
    <HealthShell>
      <HealthLaunchpad orgName={session?.orgName ?? "Hospital"} />
    </HealthShell>
  )
}
