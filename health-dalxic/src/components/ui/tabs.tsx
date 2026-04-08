"use client";

import { useState, createContext, useContext, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TabsContext = createContext<{ active: string; setActive: (v: string) => void }>({
  active: "",
  setActive: () => {},
});

export function Tabs({ defaultValue, children, className = "" }: { defaultValue: string; children: ReactNode; className?: string }) {
  const [active, setActive] = useState(defaultValue);
  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className = "", dark = false }: { children: ReactNode; className?: string; dark?: boolean }) {
  return (
    <div
      className={`inline-flex gap-1 p-1 rounded-full ${
        dark ? "bg-nl-navy-3/60 border border-nl-navy-4" : "bg-nl-surface border border-nl-border"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children, dark = false }: { value: string; children: ReactNode; dark?: boolean }) {
  const { active, setActive } = useContext(TabsContext);
  const isActive = active === value;

  return (
    <button
      type="button"
      onClick={() => setActive(value)}
      className={`relative px-5 py-2 text-sm font-body font-medium rounded-full transition-all duration-300 ${
        isActive
          ? dark
            ? "text-white"
            : "text-nl-text"
          : dark
          ? "text-nl-navy-muted hover:text-nl-chrome"
          : "text-nl-muted hover:text-nl-text"
      }`}
    >
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className={`absolute inset-0 rounded-full ${
            dark ? "bg-nl-navy-4 shadow-glow-blue" : "bg-white shadow-sm"
          }`}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

export function TabsContent({ value, children, className = "" }: { value: string; children: ReactNode; className?: string }) {
  const { active } = useContext(TabsContext);

  return (
    <AnimatePresence mode="wait">
      {active === value && (
        <motion.div
          key={value}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className={`mt-5 ${className}`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
