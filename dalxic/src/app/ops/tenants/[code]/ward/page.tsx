"use client"

import { AdmissionEngine } from "@/components/behaviours/AdmissionEngine"
import { MOCK_TENANTS, VERTICAL_ACCENT } from "@/lib/ops/mock"
import { useParams } from "next/navigation"

export default function GatewayWard() {
  const { code } = useParams() as { code: string }
  const tenant = MOCK_TENANTS.find(t => t.code === code)
  if (!tenant) return null
  return <AdmissionEngine accent={VERTICAL_ACCENT[tenant.type] ?? "emerald"} tenant={tenant} mode="bed" />
}
