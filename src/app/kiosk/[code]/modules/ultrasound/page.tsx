"use client"

import { ProcedureEngine } from "@/components/behaviours/ProcedureEngine"
import { MOCK_TENANTS, VERTICAL_ACCENT } from "@/lib/ops/mock"
import { useParams } from "next/navigation"

export default function KioskUltrasound() {
  const { code } = useParams() as { code: string }
  const tenant = MOCK_TENANTS.find(t => t.code === code)
  if (!tenant) return null
  return <ProcedureEngine accent={VERTICAL_ACCENT[tenant.type] ?? "emerald"} tenant={tenant} mode="imaging" />
}
