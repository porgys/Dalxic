"use client"

import { WorkspaceShell } from "@/components/workspace/WorkspaceShell"
import { StationGate } from "@/components/workspace/StationGate"
import { MOCK_TENANTS, VERTICAL_ACCENT, VERTICAL_LABEL } from "@/lib/ops/mock"
import { useAuth } from "@/lib/use-auth"
import { useParams, usePathname } from "next/navigation"

export default function KioskModulesLayout({ children }: { children: React.ReactNode }) {
  const { code } = useParams() as { code: string }
  const pathname = usePathname()
  const { session } = useAuth()
  const tenant = MOCK_TENANTS.find(t => t.code === code)

  if (!tenant) {
    return (
      <div style={{ padding: 80, textAlign: "center", color: "#ECF5F0" }}>
        Not found
      </div>
    )
  }

  const segments = pathname.split("/")
  const moduleSlug = segments.length > 4 ? segments[4] : null
  const isLaunchpad = !moduleSlug

  const content = isLaunchpad || !moduleSlug ? (
    children
  ) : (
    <StationGate
      moduleId={moduleSlug}
      orgType={tenant.type}
      orgCode={tenant.code}
      activeModules={tenant.activeModules}
    >
      {children}
    </StationGate>
  )

  return (
    <WorkspaceShell
      accent={VERTICAL_ACCENT[tenant.type] ?? "emerald"}
      verticalName={VERTICAL_LABEL[tenant.type] ?? "Platform"}
      orgName={tenant.name}
      orgCode={tenant.code}
      operator={session?.operatorName}
    >
      {content}
    </WorkspaceShell>
  )
}
