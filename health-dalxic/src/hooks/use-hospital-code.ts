"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "dalxic_hospital_code";
const DEFAULT_CODE = "KBH";

const APEX_SUFFIXES = ["health.dalxic.com", "localhost"];

let cachedCode: string | null = null;
const inflight = new Map<string, Promise<string | null>>();

function parseSubdomain(): string | null {
  if (typeof window === "undefined") return null;
  const host = window.location.hostname.toLowerCase();
  if (host === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return null;
  for (const apex of APEX_SUFFIXES) {
    if (host === apex) return null;
    if (host.endsWith("." + apex)) {
      const prefix = host.slice(0, -1 * (apex.length + 1));
      if (!prefix || prefix === "www") return null;
      return prefix.split(".")[0];
    }
  }
  return null;
}

function readQuery(): string | null {
  if (typeof window === "undefined") return null;
  const q = new URLSearchParams(window.location.search).get("hospital");
  return q ? q.toUpperCase() : null;
}

function readStorage(): string | null {
  if (typeof window === "undefined") return null;
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

function writeStorage(code: string) {
  try { localStorage.setItem(STORAGE_KEY, code); } catch { /* ignore */ }
}

async function resolveFromSubdomain(sub: string): Promise<string | null> {
  const existing = inflight.get(sub);
  if (existing) return existing;
  const p = (async () => {
    try {
      const res = await fetch(`/api/hospitals?subdomain=${encodeURIComponent(sub)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return typeof data?.code === "string" ? data.code : null;
    } catch {
      return null;
    } finally {
      inflight.delete(sub);
    }
  })();
  inflight.set(sub, p);
  return p;
}

function initialCode(fallback: string): string {
  if (cachedCode) return cachedCode;
  const q = readQuery();
  if (q) { cachedCode = q; writeStorage(q); return q; }
  const stored = readStorage();
  if (stored) { cachedCode = stored; return stored; }
  return fallback;
}

export function useHospitalCode(fallback: string = DEFAULT_CODE): string {
  const [code, setCode] = useState<string>(() => initialCode(fallback));

  useEffect(() => {
    if (cachedCode && cachedCode === code) {
      const sub = parseSubdomain();
      if (!sub) return;
      resolveFromSubdomain(sub).then((resolved) => {
        if (resolved && resolved !== cachedCode) {
          cachedCode = resolved;
          writeStorage(resolved);
          setCode(resolved);
        }
      });
      return;
    }
    const q = readQuery();
    if (q) { cachedCode = q; writeStorage(q); setCode(q); return; }
    const sub = parseSubdomain();
    if (sub) {
      resolveFromSubdomain(sub).then((resolved) => {
        if (resolved) {
          cachedCode = resolved;
          writeStorage(resolved);
          setCode(resolved);
        }
      });
      return;
    }
    const stored = readStorage();
    if (stored && stored !== code) { cachedCode = stored; setCode(stored); }
  }, [code]);

  return code;
}
