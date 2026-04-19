import { hash, verify } from "@node-rs/argon2"
import { createHmac, timingSafeEqual } from "crypto"

const ARGON2_OPTIONS = {
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 1,
  hashLength: 32,
}

export async function hashPin(pin: string): Promise<string> {
  return hash(pin, ARGON2_OPTIONS)
}

export async function verifyPin(pin: string, hashedPin: string): Promise<boolean> {
  try {
    return await verify(hashedPin, pin)
  } catch {
    return false
  }
}

function getMasterSecret(): string | null {
  return process.env.MASTER_SECRET || null
}

export function generateMasterSig(orgCode: string): string | null {
  const secret = getMasterSecret()
  if (!secret) return null
  return createHmac("sha256", secret).update(orgCode).digest("hex")
}

export function verifyMasterSig(orgCode: string, signature: string): boolean {
  const secret = getMasterSecret()
  if (!secret) return false

  const expected = createHmac("sha256", secret).update(orgCode).digest("hex")

  const sigBuf = Buffer.from(signature, "hex")
  const expectedBuf = Buffer.from(expected, "hex")

  if (sigBuf.length !== expectedBuf.length) return false
  return timingSafeEqual(sigBuf, expectedBuf)
}
