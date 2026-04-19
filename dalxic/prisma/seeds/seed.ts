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
    where: { code: "KBH" },
    update: {},
    create: {
      code: "KBH",
      name: "Korle-Bu Teaching Hospital",
      type: "health",
      tier: "T3",
      activeBehaviours: ["consultation", "procedure", "product", "admission", "recurring", "admin"],
      activeModules: ["*"],
      paymentGate: "pay_before",
      currency: "GHS",
      timezone: "Africa/Accra",
      maxOperators: 10,
      maxBranches: 3,
      whatsappBundle: 500,
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
    where: { code: "DEMO" },
    update: {},
    create: {
      code: "DEMO",
      name: "Demo Trade Store",
      type: "trade",
      tier: "T2",
      activeBehaviours: ["product", "admin"],
      activeModules: ["trade.categories", "trade.products", "trade.sales", "trade.inventory", "trade.analytics", "whatsapp"],
      paymentGate: "pay_after",
      currency: "GHS",
      timezone: "Africa/Accra",
      maxOperators: 3,
      maxBranches: 1,
      whatsappBundle: 100,
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
    where: { code: "ACAD" },
    update: {},
    create: {
      code: "ACAD",
      name: "Academy Institute",
      type: "institute",
      tier: "T2",
      activeBehaviours: ["recurring", "admin"],
      activeModules: ["institute.groups", "institute.members", "institute.staff", "institute.fees", "institute.schedule", "whatsapp"],
      paymentGate: "pay_before",
      currency: "GHS",
      timezone: "Africa/Accra",
      maxOperators: 3,
      maxBranches: 1,
      whatsappBundle: 100,
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

  console.log("Seed complete: KBH (health), DEMO (trade), ACAD (institute) — all PINs hashed with Argon2id")
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
