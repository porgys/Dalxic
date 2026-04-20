"use client"

import { useEffect, ReactNode } from "react"

export function KioskFrame({ children }: { children: ReactNode }) {
  useEffect(() => {
    function preventBack(e: PopStateEvent) {
      window.history.pushState(null, "", window.location.href)
    }
    window.history.pushState(null, "", window.location.href)
    window.addEventListener("popstate", preventBack)

    function preventKeys(e: KeyboardEvent) {
      if (e.altKey && e.key === "F4") e.preventDefault()
      if (e.key === "F5") e.preventDefault()
      if ((e.ctrlKey || e.metaKey) && e.key === "r") e.preventDefault()
      if ((e.ctrlKey || e.metaKey) && e.key === "w") e.preventDefault()
      if ((e.ctrlKey || e.metaKey) && e.key === "l") e.preventDefault()
      if (e.key === "Escape") e.preventDefault()
    }
    window.addEventListener("keydown", preventKeys)

    function preventContext(e: MouseEvent) { e.preventDefault() }
    window.addEventListener("contextmenu", preventContext)

    return () => {
      window.removeEventListener("popstate", preventBack)
      window.removeEventListener("keydown", preventKeys)
      window.removeEventListener("contextmenu", preventContext)
    }
  }, [])

  return (
    <div style={{ cursor: "default", userSelect: "none", WebkitUserSelect: "none" }}>
      {children}
    </div>
  )
}
