/**
 * Build-time route alignment assertion.
 *
 * Checks that every /w/ rewrite in next.config.mjs has:
 *   1. A matching src/app/<destination>/page.tsx (or _internal route)
 *   2. A matching ROUTE_MAP entry in src/lib/tier-defaults.ts
 *
 * Run: `bun scripts/check-routes.ts` or `npx tsx scripts/check-routes.ts`
 * Exits non-zero on drift. Wire into CI or pre-deploy step.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

function extractRewrites(nextConfig: string): Array<{ source: string; destination: string }> {
  const out: Array<{ source: string; destination: string }> = [];
  const re = /\{\s*source:\s*"([^"]+)",\s*destination:\s*"([^"]+)"\s*\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(nextConfig))) out.push({ source: m[1], destination: m[2] });
  return out;
}

function extractRouteMapValues(tierDefaults: string): Set<string> {
  const out = new Set<string>();
  const block = tierDefaults.match(/ROUTE_MAP\s*=\s*\{([\s\S]*?)\}\s*as const/);
  if (!block) return out;
  const re = /"([^"]+)"\s*:\s*"([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block[1]))) out.add(m[2]);
  return out;
}

function pageExistsForDestination(destination: string): boolean {
  if (!destination.startsWith("/")) return false;
  const appPath = resolve(ROOT, "src/app" + destination, "page.tsx");
  if (existsSync(appPath)) return true;
  const nestedPath = resolve(ROOT, "src/app" + destination + "/route.ts");
  return existsSync(nestedPath);
}

const nextConfig = readFileSync(resolve(ROOT, "next.config.mjs"), "utf8");
const tierDefaults = readFileSync(resolve(ROOT, "src/lib/tier-defaults.ts"), "utf8");

const rewrites = extractRewrites(nextConfig);
const routeMapValues = extractRouteMapValues(tierDefaults);

const errors: string[] = [];
const warnings: string[] = [];

for (const r of rewrites) {
  if (!pageExistsForDestination(r.destination)) {
    errors.push(`Rewrite "${r.source}" → "${r.destination}" has no matching src/app${r.destination}/page.tsx`);
  }
  if (!routeMapValues.has(r.source)) {
    warnings.push(`Rewrite "${r.source}" is not tracked in ROUTE_MAP (src/lib/tier-defaults.ts)`);
  }
}

for (const v of routeMapValues) {
  // Non-hashed paths (e.g. "/finance", "/rates") are direct routes with no rewrite.
  // Only /w/ and /s/ hashes are expected to appear in next.config.mjs rewrites.
  if (!v.startsWith("/w/") && !v.startsWith("/s/")) {
    if (!pageExistsForDestination(v)) {
      errors.push(`ROUTE_MAP direct route "${v}" has no matching src/app${v}/page.tsx`);
    }
    continue;
  }
  const match = rewrites.find((r) => r.source === v);
  if (!match) {
    errors.push(`ROUTE_MAP value "${v}" has no matching rewrite in next.config.mjs`);
  }
}

if (warnings.length) {
  console.warn("\nRoute alignment warnings:");
  for (const w of warnings) console.warn("  ! " + w);
}

if (errors.length) {
  console.error("\nRoute alignment FAILED:");
  for (const e of errors) console.error("  ✗ " + e);
  console.error(`\n${errors.length} error(s), ${warnings.length} warning(s)`);
  process.exit(1);
}

console.log(`✓ Routes aligned: ${rewrites.length} rewrites, ${routeMapValues.size} ROUTE_MAP entries, ${warnings.length} warnings.`);
process.exit(0);
