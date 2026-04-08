"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

interface SidebarProps {
  hospitalName?: string;
  role?: string;
  variant?: "health" | "dalxic";
  children: ReactNode;
}

export function Sidebar({ hospitalName, role, variant = "health", children }: SidebarProps) {
  const isDalxic = variant === "dalxic";

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="w-[260px] min-h-screen flex flex-col border-r border-[rgba(184,115,51,0.1)]"
      style={{ background: "linear-gradient(180deg, rgba(12,8,6,1) 0%, rgba(6,4,10,1) 100%)" }}
    >
      {/* Brand */}
      <div className="p-6 border-b border-[rgba(184,115,51,0.1)]">
        <Link href="/platform" className="block no-underline">
          <div className="flex flex-col gap-0.5">
            {isDalxic ? (
              <>
                <span className="font-display font-light text-nl-chrome tracking-brand text-xs uppercase">
                  DALXIC
                </span>
                <span className="font-display font-medium text-nl-copper text-sm mt-0.5">
                  Master Control
                </span>
              </>
            ) : (
              <>
                <span className="font-display font-light text-[#94A3B8] tracking-[0.22em] text-xs uppercase">
                  NEXUSLINK
                </span>
                <span className="font-display font-medium text-xs uppercase mt-0.5" style={{
                  letterSpacing: "0.5em",
                  background: "linear-gradient(135deg, #B87333, #D4956B, #B87333)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}>
                  HEALTH
                </span>
              </>
            )}
          </div>
        </Link>
        {hospitalName && (
          <p className="mt-4 text-sm font-body text-[#94A3B8]/80">{hospitalName}</p>
        )}
        {role && (
          <div className="mt-2 inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B87333]" style={{ boxShadow: "0 0 8px rgba(184,115,51,0.6)" }} />
            <span className="text-[11px] font-mono text-[#B87333] uppercase tracking-wide">
              {role}
            </span>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-3 flex flex-col gap-0.5">
        {children}
      </nav>

      {/* Footer */}
      <div className="p-5 border-t border-[rgba(184,115,51,0.1)]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full border border-[rgba(184,115,51,0.2)] flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-[rgba(184,115,51,0.4)]" />
          </div>
          <p className="text-[10px] font-body text-[#64748B]">
            {isDalxic ? "NexusLink Health" : "A Dalxic Subsidiary"}
          </p>
        </div>
      </div>
    </motion.aside>
  );
}

interface NavItemProps {
  label: string;
  active?: boolean;
  icon?: ReactNode;
  onClick?: () => void;
}

export function NavItem({ label, active, icon, onClick }: NavItemProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`relative w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-body transition-all duration-300 ${
        active
          ? "text-white"
          : "text-[#64748B] hover:text-[#94A3B8]"
      }`}
    >
      {active && (
        <motion.div
          layoutId="activeNav"
          className="absolute inset-0 rounded-xl border"
          style={{
            background: "rgba(184,115,51,0.08)",
            borderColor: "rgba(184,115,51,0.15)",
          }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      <span className="relative z-10 flex items-center gap-3">
        {icon}
        {label}
      </span>
      {active && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#B87333]"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
    </motion.button>
  );
}
