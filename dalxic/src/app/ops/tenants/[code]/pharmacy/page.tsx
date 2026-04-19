"use client"

import { ProductEngine } from "@/components/behaviours/ProductEngine"
import { MOCK_TENANTS, VERTICAL_ACCENT } from "@/lib/ops/mock"
import { useParams } from "next/navigation"

export default function GatewayPharmacy() {
  const { code } = useParams() as { code: string }
  const tenant = MOCK_TENANTS.find(t => t.code === code)
  if (!tenant) return null
  return <ProductEngine accent={VERTICAL_ACCENT[tenant.type] ?? "emerald"} tenant={tenant} mode="dispense" />
}
