"use client";

import { SelectHTMLAttributes, forwardRef } from "react";
import { motion } from "framer-motion";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  dark?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, dark = false, className = "", id, ...props }, ref) => {
    const baseSelect = dark
      ? "bg-nl-navy-3/80 border-nl-navy-4 text-white focus:ring-nl-blue/40 focus:border-nl-blue/40"
      : "bg-white border-nl-border text-nl-text focus:ring-nl-blue/30 focus:border-nl-blue/30";

    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-1.5"
      >
        {label && (
          <label htmlFor={id} className={`text-sm font-medium font-body ${dark ? "text-nl-chrome" : "text-nl-text"}`}>
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={`w-full rounded-xl border px-4 py-2.5 text-sm font-body transition-all duration-300 focus:outline-none focus:ring-2 ${baseSelect} ${
            error ? "border-red-400 focus:ring-red-400/30" : ""
          } ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-red-400"
          >
            {error}
          </motion.p>
        )}
      </motion.div>
    );
  }
);
Select.displayName = "Select";
