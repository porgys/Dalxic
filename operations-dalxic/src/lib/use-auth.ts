"use client"
import { useState, useCallback } from "react"

export interface Session {
  operatorId: string
  operatorName: string
  operatorRole: string
  orgId: string
  orgCode: string
  orgName: string
  orgType: string
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(() => {
    if (typeof window === "undefined") return null
    const stored = sessionStorage.getItem("dalxic_session")
    if (!stored) return null
    try { return JSON.parse(stored) } catch { return null }
  })

  const login = useCallback(async (orgCode: string, pin: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/operators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgCode, action: "login", pin }),
      })
      const data = await res.json()
      if (!res.ok) return { success: false, error: data.error || "Login failed" }

      const sess: Session = {
        operatorId: data.operatorId,
        operatorName: data.operatorName,
        operatorRole: data.operatorRole,
        orgId: data.orgId,
        orgCode: data.orgCode,
        orgName: data.orgName,
        orgType: data.orgType,
      }
      sessionStorage.setItem("dalxic_session", JSON.stringify(sess))
      setSession(sess)
      return { success: true }
    } catch {
      return { success: false, error: "Network error" }
    }
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem("dalxic_session")
    setSession(null)
  }, [])

  const authHeaders = useCallback((): Record<string, string> => {
    if (!session) return {}
    return {
      "x-operator-id": session.operatorId,
      "x-org-code": session.orgCode,
    }
  }, [session])

  const authFetch = useCallback(async (url: string, options?: RequestInit): Promise<Response> => {
    const headers = new Headers(options?.headers)
    if (session) {
      headers.set("x-operator-id", session.operatorId)
      headers.set("x-org-code", session.orgCode)
    }
    const res = await fetch(url, { ...options, headers })
    if (res.status === 401) {
      sessionStorage.removeItem("dalxic_session")
      setSession(null)
    }
    return res
  }, [session])

  return { session, login, logout, authHeaders, authFetch }
}
