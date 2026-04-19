"use client"

import { ConsultationEngine } from "@/components/behaviours/ConsultationEngine"
import { MOCK_TENANTS, VERTICAL_ACCENT } from "@/lib/ops/mock"
import { useParams } from "next/navigation"

export default function GatewayFrontDesk() {
  const { code } = useParams() as { code: string }
  const tenant = MOCK_TENANTS.find(t => t.code === code)
  if (!tenant) return null
  return <ConsultationEngine accent={VERTICAL_ACCENT[tenant.type] ?? "emerald"} tenant={tenant} mode="intake" />
}
