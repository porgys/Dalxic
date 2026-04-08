"use client";

import { HTMLAttributes } from "react";
import { motion } from "framer-motion";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "copper" | "glow";

const variants: Record<BadgeVariant, string> = {
  default: "bg-nl-navy-3 text-nl-chrome border border-nl-navy-4",
  success: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  danger: "bg-red-500/10 text-red-400 border border-red-500/20",
  info: "bg-nl-blue/10 text-nl-blue border border-nl-blue/20",
  copper: "bg-nl-copper/10 text-nl-copper border border-nl-copper/20",
  glow: "bg-nl-blue/15 text-nl-blue border border-nl-blue/30 shadow-glow-blue",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  pulse?: boolean;
}

export function Badge({ variant = "default", pulse = false, className = "", children, ...props }: BadgeProps) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium font-body ${variants[variant]} ${className}`}
      {...(props as React.ComponentProps<typeof motion.span>)}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
        </span>
      )}
      {children}
    </motion.span>
  );
}
