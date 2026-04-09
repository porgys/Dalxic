"use client";

import { useState, useEffect, useCallback } from "react";
import type { OperatorSession } from "@/types";

const STORAGE_KEY = "nexuslink_operator_session";

/**
 * Manages operator login session via localStorage.
 * Each browser tab shares the session — login on one tab, all tabs unlock.
 * Logout clears the session across tabs via storage event.
 */
export function useOperator(hospitalCode: string) {
  const [session, setSession] = useState<OperatorSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Load session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as OperatorSession;
        // Only accept if same hospital
        if (parsed.hospitalCode === hospitalCode) {
          setSession(parsed);
        }
      }
    } catch {
      // Corrupt data — ignore
    }
    setLoading(false);
  }, [hospitalCode]);

  // Heartbeat — ping every 5 min to keep operator "online"
  useEffect(() => {
    if (!session?.operatorId) return;
    const interval = setInterval(() => {
      fetch("/api/operators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalCode, action: "heartbeat", operatorId: session.operatorId }),
      }).catch(() => {});
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [hospitalCode, session?.operatorId]);

  // Listen for cross-tab session changes
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      if (e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as OperatorSession;
          if (parsed.hospitalCode === hospitalCode) {
            setSession(parsed);
          }
        } catch { /* ignore */ }
      } else {
        // Cleared — logout from another tab
        setSession(null);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [hospitalCode]);

  const login = useCallback(async (pin: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/operators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalCode, action: "login", pin }),
      });

      if (!res.ok) {
        const err = await res.json();
        return { success: false, error: err.error || "Login failed" };
      }

      const data = await res.json() as OperatorSession;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setSession(data);
      return { success: true };
    } catch {
      return { success: false, error: "Network error" };
    }
  }, [hospitalCode]);

  const logout = useCallback(async () => {
    if (session?.operatorId) {
      fetch("/api/operators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalCode,
          action: "logout",
          operatorId: session.operatorId,
        }),
      }).catch(() => {});
    }
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }, [hospitalCode, session]);

  return {
    session,
    isAuthenticated: !!session,
    loading,
    login,
    logout,
    operatorName: session?.operatorName ?? null,
    operatorId: session?.operatorId ?? null,
    operatorRole: session?.operatorRole ?? null,
  };
}
