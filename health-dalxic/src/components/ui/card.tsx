"use client";

import { HTMLAttributes } from "react";
import { motion } from "framer-motion";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "light" | "dark" | "glass";
  hover?: boolean;
  accent?: "blue" | "copper" | "none";
  glow?: boolean;
}

const variantStyles = {
  light:
    "bg-white border border-nl-border shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_24px_rgba(0,0,0,0.03)]",
  dark:
    "bg-gradient-to-b from-[#0D1117] to-[#0B0F18] border border-nl-border-dark/60",
  glass:
    "bg-white/5 backdrop-blur-xl border border-white/10",
};

const accentStyles = {
  blue: "border-t-2 border-t-nl-blue",
  copper: "border-t-2 border-t-nl-copper",
  none: "",
};

export function Card({
  variant = "light",
  hover = false,
  accent = "none",
  glow = false,
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      whileHover={
        hover
          ? {
              y: -3,
              transition: { duration: 0.25, ease: "easeOut" },
            }
          : undefined
      }
      className={`rounded-2xl p-6 ${variantStyles[variant]} ${accentStyles[accent]} ${
        glow
          ? variant === "dark"
            ? "shadow-glow-blue"
            : "shadow-glow-blue"
          : ""
      } ${
        hover
          ? "cursor-pointer transition-all duration-300 hover:border-nl-blue/30 hover:shadow-glow-blue"
          : ""
      } ${className}`}
      {...(props as React.ComponentProps<typeof motion.div>)}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`mb-5 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className = "", children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={`text-lg font-display font-medium tracking-tight ${className}`} {...props}>
      {children}
    </h3>
  );
}
