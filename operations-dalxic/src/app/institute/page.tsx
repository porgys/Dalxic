"use client"
import { InstituteShell } from "@/components/ops/InstituteShell"
import { InstituteLaunchpad } from "@/components/ops/InstituteLaunchpad"
import { useAuth } from "@/lib/use-auth"

export default function InstitutePage() {
  const { session } = useAuth()
  return (
    <InstituteShell>
      <InstituteLaunchpad orgName={session?.orgName ?? "School"} />
    </InstituteShell>
  )
}
