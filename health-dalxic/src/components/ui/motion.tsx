"use client";

import { ReactNode } from "react";
import { motion, Variants } from "framer-motion";

// Stagger container for lists
export function StaggerContainer({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.08,
            delayChildren: delay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Individual stagger item
export function StaggerItem({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const item: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
    },
  };

  return (
    <motion.div variants={item} className={className}>
      {children}
    </motion.div>
  );
}

// Page wrapper with fade in
export function PageTransition({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Floating dot decoration (Dalxic DNA)
export function FloatingDot({
  size = "md",
  color = "blue",
  delay = 0,
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  color?: "blue" | "copper";
  delay?: number;
  className?: string;
}) {
  const sizes = {
    sm: { outer: "w-6 h-6", inner: "w-2 h-2" },
    md: { outer: "w-10 h-10", inner: "w-3 h-3" },
    lg: { outer: "w-14 h-14", inner: "w-4 h-4" },
  };

  const colors = {
    blue: { border: "border-nl-blue/30", fill: "bg-nl-blue" },
    copper: { border: "border-nl-copper/30", fill: "bg-nl-copper" },
  };

  return (
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
      className={`rounded-full border-2 ${colors[color].border} ${sizes[size].outer} flex items-center justify-center ${className}`}
    >
      <div className={`rounded-full ${colors[color].fill} ${sizes[size].inner}`} />
    </motion.div>
  );
}

// Stat counter with animated number
export function StatNumber({
  value,
  label,
  color = "blue",
  className = "",
}: {
  value: number | string;
  label: string;
  color?: "blue" | "copper" | "white";
  className?: string;
}) {
  const colorClass = {
    blue: "text-nl-blue",
    copper: "text-nl-copper",
    white: "text-white",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className={className}
    >
      <p className={`text-4xl font-mono font-bold ${colorClass[color]}`}>{value}</p>
      <p className="text-sm text-nl-chrome font-body mt-1">{label}</p>
    </motion.div>
  );
}
