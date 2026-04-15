"use client"
import { useAuth } from "@/lib/use-auth"
import { Shell } from "@/components/ops/Shell"
import { Launchpad } from "@/components/ops/Launchpad"

export default function TradeLaunchpadPage() {
  return <ShellWithLaunchpad />
}

function ShellWithLaunchpad() {
  const { session } = useAuth()
  return (
    <Shell>
      <Launchpad orgName={session?.orgName ?? "Your Business"} />
    </Shell>
  )
}
