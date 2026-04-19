"use client"

import { POSPage } from "@/components/modules/POSPage"
import { MOCK_TENANTS, VERTICAL_ACCENT } from "@/lib/ops/mock"
import { useParams } from "next/navigation"

export default function GatewayPOS() {
  const { code } = useParams() as { code: string }
  const tenant = MOCK_TENANTS.find((t) => t.code === code)
  if (!tenant) return null
  return (
    <POSPage
      accent={VERTICAL_ACCENT[tenant.type] ?? "emerald"}
      tenant={tenant}
    />
  )
}
