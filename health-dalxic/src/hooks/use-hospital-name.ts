"use client";

import { useState, useEffect } from "react";

const cache = new Map<string, string>();
const inflight = new Map<string, Promise<string | null>>();

async function fetchHospitalName(code: string): Promise<string | null> {
  const existing = inflight.get(code);
  if (existing) return existing;

  const p = (async () => {
    try {
      const res = await fetch(`/api/hospitals?code=${code}`);
      if (!res.ok) return null;
      const data = await res.json();
      const name: string | undefined = data?.name ?? data?.hospital?.name;
      if (name) {
        cache.set(code, name);
        return name;
      }
      return null;
    } catch {
      return null;
    } finally {
      inflight.delete(code);
    }
  })();

  inflight.set(code, p);
  return p;
}

export function useHospitalName(code: string, fallback: string): string {
  const [name, setName] = useState<string>(() => cache.get(code) ?? fallback);

  useEffect(() => {
    if (cache.has(code)) {
      setName(cache.get(code)!);
      return;
    }
    let cancelled = false;
    fetchHospitalName(code).then((resolved) => {
      if (!cancelled && resolved) setName(resolved);
    });
    return () => { cancelled = true; };
  }, [code]);

  return name;
}
