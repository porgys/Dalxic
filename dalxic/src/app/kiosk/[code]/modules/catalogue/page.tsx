"use client"

import { CataloguePage } from "@/components/modules/CataloguePage"
import { MOCK_TENANTS, VERTICAL_ACCENT } from "@/lib/ops/mock"
import { useParams } from "next/navigation"

export default function KioskCatalogue() {
  const { code } = useParams() as { code: string }
  const tenant = MOCK_TENANTS.find(t => t.code === code)

  if (!tenant) return null

  return <CataloguePage accent={VERTICAL_ACCENT[tenant.type] ?? "emerald"} tenant={tenant} />
}
