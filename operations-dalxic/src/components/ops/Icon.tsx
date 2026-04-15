/* ═══════════════════════════════════════════════════════════════
   ICON SYSTEM — minimal stroke icons, premium feel.
   No emoji. Single component renders by name.
   ═══════════════════════════════════════════════════════════════ */

export type IconName =
  | "dashboard" | "pos" | "inventory" | "orders" | "analytics"
  | "customers" | "loyalty" | "returns" | "receipts"
  | "stock" | "branches" | "labels"
  | "suppliers" | "po"
  | "coa" | "journals" | "financials" | "expenses" | "tax" | "reconciliation"
  | "shifts" | "payroll" | "reports"
  | "audit" | "roles"
  | "menu" | "close" | "search" | "plus" | "edit" | "trash" | "check" | "chevron-right"
  | "download" | "print" | "share" | "filter" | "settings" | "logout" | "lock"
  | "phone" | "mail" | "whatsapp" | "calendar" | "tag" | "user"

const PATHS: Record<IconName, string> = {
  dashboard:      "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z",
  pos:            "M4 7h16v10H4zM7 17v3M17 17v3M2 7l2-3h16l2 3M9 11h6",
  inventory:      "M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7M12 11v10",
  orders:         "M4 4h16v4H4zM4 12h16v4H4zM4 20h10v0M8 6h.01M8 14h.01",
  analytics:      "M3 3v18h18M7 14l3-4 4 3 5-7",
  customers:      "M16 7a4 4 0 11-8 0 4 4 0 018 0zM4 21a8 8 0 0116 0",
  loyalty:        "M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z",
  returns:        "M3 7l4-4M3 7l4 4M3 7h12a6 6 0 010 12H9",
  receipts:       "M6 2h12v20l-3-2-3 2-3-2-3 2V2zM9 8h6M9 12h6M9 16h4",
  stock:          "M5 8l7-4 7 4M5 8v8l7 4 7-4V8M5 8l7 4 7-4M12 12v9",
  branches:       "M3 9h18v12H3zM7 9V5a5 5 0 0110 0v4M9 14h6",
  labels:         "M3 7h18v3H3zM3 14h18v3H3zM6 7v10M10 7v10M14 7v10M18 7v10",
  suppliers:      "M3 13h2l3 8h8l3-8h2M5 13l2-8h10l2 8M9 17h.01M15 17h.01",
  po:             "M9 3h6a2 2 0 012 2v2H7V5a2 2 0 012-2zM5 7h14l-1 14H6L5 7zM10 11v6M14 11v6",
  coa:            "M3 4h18M3 4v16M21 4v16M3 12h18M3 20h18M9 4v16M15 4v16",
  journals:       "M4 4h12a4 4 0 014 4v12H8a4 4 0 01-4-4zM8 8h8M8 12h8M8 16h5",
  financials:     "M3 3v18h18M7 17V9M11 17v-5M15 17v-9M19 17v-3",
  expenses:       "M12 1v22M5 7c0-2 2-3 7-3s7 1 7 3-2 3-7 3-7 1-7 3 2 3 7 3 7 1 7 3-2 3-7 3-7-1-7-3",
  tax:            "M9 14l6-6M9 9h.01M15 15h.01M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
  reconciliation: "M3 3l6 6M9 3l-6 6M3 15l6 6M9 15l-6 6M15 3l6 18M21 3l-6 18",
  shifts:         "M12 6v6l4 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  payroll:        "M2 7h20v10H2zM12 12a3 3 0 100-6 3 3 0 000 6zM6 17v0M18 17v0",
  reports:        "M9 5h6a2 2 0 012 2v14H7V7a2 2 0 012-2zM5 9h2M5 15h2M17 9h2M17 15h2",
  audit:          "M9 11l3 3 7-7M5 12a7 7 0 1014 0 7 7 0 00-14 0z",
  roles:          "M12 11a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0M19 11l2 2-4 4-2-2",
  menu:           "M3 6h18M3 12h18M3 18h18",
  close:          "M6 6l12 12M18 6l-12 12",
  search:         "M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35",
  plus:           "M12 5v14M5 12h14",
  edit:           "M3 21l3.75-.75L18 9 15 6 3.75 17.25 3 21zM14 7l3 3",
  trash:          "M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M6 6l1 14a2 2 0 002 2h6a2 2 0 002-2l1-14",
  check:          "M5 12l5 5L20 7",
  "chevron-right":"M9 6l6 6-6 6",
  download:       "M12 4v12M6 14l6 6 6-6M4 22h16",
  print:          "M6 9V3h12v6M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z",
  share:          "M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v14",
  filter:         "M3 4h18M6 12h12M10 20h4",
  settings:       "M12 8a4 4 0 100 8 4 4 0 000-8zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z",
  logout:         "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  lock:           "M5 11h14v10H5zM8 11V7a4 4 0 118 0v4",
  phone:          "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z",
  mail:           "M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zM2 6l10 7 10-7",
  whatsapp:       "M20.5 12a8.5 8.5 0 01-12.43 7.55L3.5 21l1.45-4.5A8.5 8.5 0 1120.5 12z",
  calendar:       "M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2zM3 10h18M8 2v4M16 2v4",
  tag:            "M20 12l-8 8-9-9V3h8l9 9zM7 7h.01",
  user:           "M16 7a4 4 0 11-8 0 4 4 0 018 0zM4 21a8 8 0 0116 0",
}

export function Icon({ name, size = 18, color = "currentColor", strokeWidth = 1.6, style }: {
  name: IconName
  size?: number
  color?: string
  strokeWidth?: number
  style?: React.CSSProperties
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden>
      <path d={PATHS[name]} />
    </svg>
  )
}
