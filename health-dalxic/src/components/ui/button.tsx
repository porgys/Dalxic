"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { motion, HTMLMotionProps } from "framer-motion";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "copper" | "outline";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-nl-blue to-sky-400 text-white shadow-glow-blue hover:shadow-glow-blue-md hover:brightness-110",
  secondary:
    "bg-nl-navy-3 text-white border border-nl-navy-4 hover:bg-nl-navy-4 hover:border-nl-navy-muted",
  danger:
    "bg-gradient-to-r from-red-600 to-red-500 text-white hover:brightness-110",
  ghost:
    "bg-transparent text-nl-muted hover:bg-white/5 hover:text-white",
  copper:
    "bg-gradient-to-r from-nl-copper to-nl-copper-mid text-white shadow-glow-copper hover:brightness-110",
  outline:
    "bg-transparent text-nl-blue border border-nl-blue/30 hover:bg-nl-blue/5 hover:border-nl-blue/60",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  pill?: boolean;
}

const sizeClasses = {
  sm: "px-4 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-8 py-3.5 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, pill = true, children, className = "", disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        disabled={disabled || loading}
        whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={`inline-flex items-center justify-center gap-2 font-body font-medium transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed ${
          pill ? "rounded-full" : "rounded-xl"
        } ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...(props as HTMLMotionProps<"button">)}
      >
        {loading && (
          <motion.svg
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-4 w-4"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </motion.svg>
        )}
        {children}
      </motion.button>
    );
  }
);
Button.displayName = "Button";
