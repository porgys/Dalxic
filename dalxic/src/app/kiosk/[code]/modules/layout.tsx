"use client"

import { WorkspaceShell } from "@/components/workspace/WorkspaceShell"
import { MOCK_TENANTS, VERTICAL_ACCENT, VERTICAL_LABEL } from "@/lib/ops/mock"
import { useParams } from "next/navigation"


export default function KioskModulesLayout({ children }: { children: React.ReactNode }) {
  const { code } = useParams() as { code: string }
  const tenant = MOCK_TENANTS.find(t => t.code === code)

  if (!tenant) {
    return (
      <div style={{ padding: 80, textAlign: "center", color: "#ECF5F0" }}>
        Not found
      </div>
    )
  }

  return (
    <WorkspaceShell
      accent={VERTICAL_ACCENT[tenant.type] ?? "emerald"}
      verticalName={VERTICAL_LABEL[tenant.type] ?? "Platform"}
      orgName={tenant.name}
      orgCode={tenant.code}
      operator="Operator"
    >
      {children}
    </WorkspaceShell>
  )
}
