"use client"

import { Launchpad } from "@/components/workspace/Launchpad"
import { MOCK_TENANTS, MOCK_MODULES, VERTICAL_ACCENT, VERTICAL_BRAND } from "@/lib/ops/mock"
import { useParams } from "next/navigation"


export default function KioskModules() {
  const { code } = useParams() as { code: string }
  const tenant = MOCK_TENANTS.find(t => t.code === code)

  if (!tenant) return null

  const orgModules = MOCK_MODULES.filter(m =>
    tenant.activeModules.includes(m.id) || m.vertical === "universal" || m.vertical === tenant.type
  )

  return (
    <Launchpad
      orgName={tenant.name}
      orgCode={tenant.code}
      modules={orgModules}
      activeModuleIds={tenant.activeModules}
      accent={VERTICAL_ACCENT[tenant.type] ?? "emerald"}
      verticalLabel={VERTICAL_BRAND[tenant.type] ?? "Dalxic"}
      basePath={`/kiosk/${code}/modules`}
      branches={tenant.branches}
    />
  )
}
