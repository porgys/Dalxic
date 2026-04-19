"use client"
import { useState, useCallback, useEffect } from "react"

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
  const [session, setSession] = useState<Session | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem("dalxic_session")
    if (stored) {
      try { setSession(JSON.parse(stored)) } catch { /* corrupt data */ }
    }
    setHydrated(true)
  }, [])

  const login = useCallback(async (orgCode: string, pin: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgCode, pin }),
      })
      const json = await res.json()
      if (!json.success) return { success: false, error: json.error || "Login failed" }

      const { operator, org } = json.data
      const sess: Session = {
        operatorId: operator.id,
        operatorName: operator.name,
        operatorRole: operator.role,
        orgId: org.id,
        orgCode: org.code,
        orgName: org.name,
        orgType: org.type,
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

  return { session, hydrated, login, logout, authHeaders, authFetch }
}
