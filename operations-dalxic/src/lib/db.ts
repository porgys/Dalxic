import { PrismaClient } from "@/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as { prisma: InstanceType<typeof PrismaClient> };

// Pool config with cold-start resilience: longer timeout to wake sleeping Neon compute
const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000, // 10s — enough for Neon cold start wake-up
  idleTimeoutMillis: 30000,
  max: 5,
});

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
