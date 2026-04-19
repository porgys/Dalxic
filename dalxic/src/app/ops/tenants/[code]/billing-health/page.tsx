"use client"

import { AdminEngine } from "@/components/behaviours/AdminEngine"
import { MOCK_TENANTS, VERTICAL_ACCENT } from "@/lib/ops/mock"
import { useParams } from "next/navigation"

export default function GatewayBillingHealth() {
  const { code } = useParams() as { code: string }
  const tenant = MOCK_TENANTS.find(t => t.code === code)
  if (!tenant) return null
  return <AdminEngine accent={VERTICAL_ACCENT[tenant.type] ?? "emerald"} tenant={tenant} mode="billing" />
}
