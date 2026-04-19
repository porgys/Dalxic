import { PrismaClient } from "../../src/generated/prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"
import { hash } from "@node-rs/argon2"

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const db = new PrismaClient({ adapter })

const ARGON2_OPTIONS = { memoryCost: 65536, timeCost: 3, parallelism: 1, hashLength: 32 }

async function hashPin(pin: string): Promise<string> {
  return hash(pin, ARGON2_OPTIONS)
}

async function main() {
  const pin1234 = await hashPin("1234")

  const kbh = await db.organization.upsert({
    where: { code: "KORLE-BU" },
    update: {},
    create: {
      code: "KORLE-BU",
      name: "Korle Bu Hospital",
      type: "health",
      tier: "T3",
      activeBehaviours: ["consultation", "procedure", "product", "admission", "recurring", "admin"],
      activeModules: ["front-desk","doctor","nurse-station","waiting-room","lab","pharmacy","billing-health","ward","injection-room"],
      paymentGate: "pay_before",
      currency: "GHS",
      timezone: "Africa/Accra",
      maxOperators: 10,
      maxBranches: 3,
      whatsappBundle: 500,
      labelConfig: { consultation: "Doctor Visit", procedure: "Surgery", product: "Drugs", admission: "Ward Bed", recurring: "Ward Nightly", admin: "Patient Card" },
    },
  })

  await db.branch.upsert({
    where: { id: "kbh-main" },
    update: {},
    create: { id: "kbh-main", orgId: kbh.id, name: "Main Branch", isDefault: true },
  })

  await db.operator.upsert({
    where: { orgId_pin: { orgId: kbh.id, pin: pin1234 } },
    update: {},
    create: { orgId: kbh.id, name: "Admin", pin: pin1234, role: "super_admin" },
  })

  const demo = await db.organization.upsert({
    where: { code: "KASOA-MART" },
    update: {},
    create: {
      code: "KASOA-MART",
      name: "Kasoa SuperMart",
      type: "trade",
      tier: "T2",
      activeBehaviours: ["consultation", "procedure", "product", "admission", "recurring", "admin"],
      activeModules: ["pos","inventory","stock","branches","customers","loyalty","suppliers","po","accounting","expenses","tax","shifts","reports","audit","roles"],
      paymentGate: "pay_after",
      currency: "GHS",
      timezone: "Africa/Accra",
      maxOperators: 3,
      maxBranches: 1,
      whatsappBundle: 100,
      labelConfig: { consultation: "Customer Assist", procedure: "Warehouse Pick", product: "Goods", admission: "Product → Shelf", recurring: "Supplier Credit", admin: "Bookkeeping" },
    },
  })

  await db.branch.upsert({
    where: { id: "demo-main" },
    update: {},
    create: { id: "demo-main", orgId: demo.id, name: "Main Branch", isDefault: true },
  })

  const demoPin = await hashPin("1234")
  await db.operator.upsert({
    where: { orgId_pin: { orgId: demo.id, pin: demoPin } },
    update: {},
    create: { orgId: demo.id, name: "Cashier", pin: demoPin, role: "cashier" },
  })

  const acad = await db.organization.upsert({
    where: { code: "LEGON-ACAD" },
    update: {},
    create: {
      code: "LEGON-ACAD",
      name: "Legon Preparatory School",
      type: "institute",
      tier: "T2",
      activeBehaviours: ["consultation", "procedure", "product", "admission", "recurring", "admin"],
      activeModules: ["enrollment","gradebook","fees","attendance","parents","reports","audit","roles"],
      paymentGate: "pay_before",
      currency: "GHS",
      timezone: "Africa/Accra",
      maxOperators: 3,
      maxBranches: 1,
      whatsappBundle: 100,
      labelConfig: { consultation: "Admissions", procedure: "Lessons", product: "Textbooks", admission: "Enrollment", recurring: "Term Fees", admin: "Grading" },
    },
  })

  await db.branch.upsert({
    where: { id: "acad-main" },
    update: {},
    create: { id: "acad-main", orgId: acad.id, name: "Main Campus", isDefault: true },
  })

  const acadPin = await hashPin("1234")
  await db.operator.upsert({
    where: { orgId_pin: { orgId: acad.id, pin: acadPin } },
    update: {},
    create: { orgId: acad.id, name: "Registrar", pin: acadPin, role: "registrar" },
  })

  console.log("Seed complete: KORLE-BU (health), KASOA-MART (trade), LEGON-ACAD (institute) — all PINs 1234, hashed with Argon2id")
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
