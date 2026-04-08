"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ParsedPatientEntry, ParseResponse } from "@/types";

const COPPER = "#B87333";

interface BulkPasteProps {
  hospitalCode: string;
  onParsed: (entries: ParsedPatientEntry[]) => void;
}

export function BulkPaste({ hospitalCode, onParsed }: BulkPasteProps) {
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParseResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleParse = async () => {
    if (!rawText.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText, hospitalCode }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Parsing failed");
      }
      const data: ParseResponse = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (result) onParsed(result.entries);
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="bulkText" className="block text-xs font-medium text-[#94A3B8] font-body mb-1.5">
          Paste Patient Records Below
        </label>
        <textarea
          id="bulkText"
          placeholder="Paste Hundreds Of Patient Records Here. Nexus-7 Will Detect Patient Boundaries, Structure Each Record, And Assign To The Correct Month..."
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          rows={10}
          className="w-full rounded-xl border px-4 py-3 text-sm font-body text-white placeholder:text-[#4A5568] focus:outline-none focus:ring-2 focus:ring-[#B87333]/30 focus:border-[#B87333]/30 transition-all duration-300 resize-y"
          style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(184,115,51,0.15)" }}
        />
        <p className="mt-1.5 text-xs text-[#64748B]">
          {rawText.length > 0 ? `${rawText.length} Characters` : "Supports Handwritten Notes, Typed Records, Or Any Format"}
        </p>
      </div>

      <button
        type="button"
        onClick={handleParse}
        disabled={loading || !rawText.trim()}
        className="w-full py-3 rounded-xl text-sm font-body font-medium transition-all duration-300 disabled:opacity-40"
        style={{
          background: `linear-gradient(135deg, ${COPPER}, #D4956B)`,
          color: "#fff",
          border: "none",
        }}
      >
        {loading ? "Nexus-7 Is Parsing Records..." : "Parse With Nexus-7"}
      </button>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-4 rounded-xl text-sm text-red-400"
            style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)" }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-body font-medium text-white text-sm">
                {result.totalDetected} Patient{result.totalDetected !== 1 ? "s" : ""} Detected
              </h3>
              <button
                type="button"
                onClick={handleConfirm}
                className="px-4 py-2 rounded-xl text-xs font-body font-medium text-white transition-all"
                style={{ background: `linear-gradient(135deg, ${COPPER}, #D4956B)` }}
              >
                Confirm & Save All
              </button>
            </div>

            {result.warnings.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 rounded-xl"
                style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}
              >
                <p className="text-sm font-medium text-amber-400 mb-1.5">Warnings</p>
                <ul className="text-xs text-amber-300/70 space-y-1">
                  {result.warnings.map((w, i) => (
                    <li key={i}>- {w}</li>
                  ))}
                </ul>
              </motion.div>
            )}

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {result.entries.map((entry, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <ParsedEntryCard entry={entry} index={i} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ParsedEntryCard({ entry, index }: { entry: ParsedPatientEntry; index: number }) {
  const confidenceColor = {
    high: "#22C55E",
    medium: "#F59E0B",
    low: "#EF4444",
  };
  const color = confidenceColor[entry.confidence] || "#94A3B8";

  return (
    <div
      className="rounded-xl p-4 transition-all duration-300"
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(184,115,51,0.1)",
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-[10px] text-[#64748B] font-mono">#{String(index + 1).padStart(3, "0")}</span>
          <h4 className="font-body font-medium text-white text-sm">{entry.patient.fullName}</h4>
        </div>
        <div className="flex gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono"
            style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
            {entry.confidence}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono"
            style={{ background: "rgba(14,165,233,0.1)", color: "#0EA5E9", border: "1px solid rgba(14,165,233,0.2)" }}>
            {entry.targetMonth}/{entry.targetYear}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-[#94A3B8]">
        <div>
          <span className="font-medium text-[#D4956B]">Complaint:</span> {entry.visit.chiefComplaint}
        </div>
        <div>
          <span className="font-medium text-[#D4956B]">Visit:</span> {entry.visit.date}
        </div>
        {entry.diagnosis.primary && (
          <div>
            <span className="font-medium text-[#D4956B]">Diagnosis:</span> {entry.diagnosis.primary}
          </div>
        )}
        {entry.treatment.prescriptions.length > 0 && (
          <div>
            <span className="font-medium text-[#D4956B]">Rx:</span>{" "}
            {entry.treatment.prescriptions.map((p) => p.medication).join(", ")}
          </div>
        )}
      </div>
    </div>
  );
}
