import { db } from "@/lib/db"

export async function decrementPhysical(params: {
  orgId: string
  serviceItemId: string
  branchId: string
  quantity: number
  reference?: string
  performedBy: string
}) {
  const item = await db.serviceItem.findUniqueOrThrow({ where: { id: params.serviceItemId } })
  const balanceBefore = item.stock
  const balanceAfter = balanceBefore - params.quantity

  await db.$transaction([
    db.serviceItem.update({
      where: { id: params.serviceItemId },
      data: { stock: balanceAfter },
    }),
    db.stockMovement.create({
      data: {
        orgId: params.orgId,
        serviceItemId: params.serviceItemId,
        branchId: params.branchId,
        type: "sold",
        quantity: -params.quantity,
        balanceBefore,
        balanceAfter,
        reference: params.reference,
        performedBy: params.performedBy,
      },
    }),
  ])

  return { balanceBefore, balanceAfter }
}

export async function incrementPhysical(params: {
  orgId: string
  serviceItemId: string
  branchId: string
  quantity: number
  type: string
  reference?: string
  batchNo?: string
  expiresAt?: Date
  performedBy: string
}) {
  const item = await db.serviceItem.findUniqueOrThrow({ where: { id: params.serviceItemId } })
  const balanceBefore = item.stock
  const balanceAfter = balanceBefore + params.quantity

  await db.$transaction([
    db.serviceItem.update({
      where: { id: params.serviceItemId },
      data: {
        stock: balanceAfter,
        ...(params.batchNo ? { batchNo: params.batchNo } : {}),
        ...(params.expiresAt ? { expiresAt: params.expiresAt } : {}),
      },
    }),
    db.stockMovement.create({
      data: {
        orgId: params.orgId,
        serviceItemId: params.serviceItemId,
        branchId: params.branchId,
        type: params.type,
        quantity: params.quantity,
        balanceBefore,
        balanceAfter,
        reference: params.reference,
        batchNo: params.batchNo,
        expiresAt: params.expiresAt,
        performedBy: params.performedBy,
      },
    }),
  ])

  return { balanceBefore, balanceAfter }
}

export async function occupyCapacity(params: {
  orgId: string
  serviceItemId: string
  branchId: string
  reference?: string
  performedBy: string
}) {
  const item = await db.serviceItem.findUniqueOrThrow({ where: { id: params.serviceItemId } })
  if (item.capacityTotal && item.capacityUsed >= item.capacityTotal) {
    throw new Error("No capacity available")
  }

  await db.$transaction([
    db.serviceItem.update({
      where: { id: params.serviceItemId },
      data: { capacityUsed: { increment: 1 } },
    }),
    db.stockMovement.create({
      data: {
        orgId: params.orgId,
        serviceItemId: params.serviceItemId,
        branchId: params.branchId,
        type: "occupied",
        quantity: 1,
        balanceBefore: item.capacityUsed,
        balanceAfter: item.capacityUsed + 1,
        reference: params.reference,
        performedBy: params.performedBy,
      },
    }),
  ])
}

export async function releaseCapacity(params: {
  orgId: string
  serviceItemId: string
  branchId: string
  reference?: string
  performedBy: string
}) {
  const item = await db.serviceItem.findUniqueOrThrow({ where: { id: params.serviceItemId } })

  await db.$transaction([
    db.serviceItem.update({
      where: { id: params.serviceItemId },
      data: { capacityUsed: { decrement: 1 } },
    }),
    db.stockMovement.create({
      data: {
        orgId: params.orgId,
        serviceItemId: params.serviceItemId,
        branchId: params.branchId,
        type: "released",
        quantity: -1,
        balanceBefore: item.capacityUsed,
        balanceAfter: item.capacityUsed - 1,
        reference: params.reference,
        performedBy: params.performedBy,
      },
    }),
  ])
}
