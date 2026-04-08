"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface QuickFormProps {
  hospitalCode: string;
  onSubmit: (data: QuickFormData) => void;
  loading?: boolean;
}

export interface QuickFormData {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  insuranceId: string;
  chiefComplaint: string;
  department: string;
  // Extended fields
  photoUrl?: string;
  maritalStatus?: string;
  nationality?: string;
  occupation?: string;
  address?: string;
  email?: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
  insuranceProvider?: string;
  policyHolder?: string;
  bloodType?: string;
  allergies?: string;
  currentMedications?: string;
  chronicConditions?: string[];
  symptomDuration?: string;
  symptomSeverity?: number;
  consentTreatment?: boolean;
  consentPrivacy?: boolean;
}

const DEPARTMENTS = [
  { value: "general", label: "General Consultation" },
  { value: "emergency", label: "Emergency" },
  { value: "pediatrics", label: "Pediatrics" },
  { value: "obstetrics", label: "Obstetrics & Gynaecology" },
  { value: "surgery", label: "Surgery" },
  { value: "dental", label: "Dental" },
  { value: "eye", label: "Eye Clinic" },
  { value: "ent", label: "ENT" },
];

const CHRONIC_CONDITIONS = [
  "Hypertension", "Diabetes", "Asthma", "Heart Disease", "Sickle Cell",
  "HIV/AIDS", "Tuberculosis", "Epilepsy", "Kidney Disease", "Hepatitis",
];

const STEPS = [
  { id: 1, label: "Identity", icon: "01" },
  { id: 2, label: "Contact", icon: "02" },
  { id: 3, label: "Insurance", icon: "03" },
  { id: 4, label: "Medical", icon: "04" },
  { id: 5, label: "Visit", icon: "05" },
  { id: 6, label: "Consent", icon: "06" },
];

const COPPER = "#B87333";

/* ─── Camera Capture Component ─── */
function CameraCapture({ onCapture, currentPhoto }: { onCapture: (url: string) => void; currentPhoto?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 320, facingMode: "user" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
      setCameraActive(true);
    } catch (err) {
      console.error("Camera access denied:", err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    setCameraActive(false);
  }, [stream]);

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = 320;
    canvas.height = 320;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Center-crop to square
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const size = Math.min(vw, vh);
    const sx = (vw - size) / 2;
    const sy = (vh - size) / 2;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, 320, 320);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    onCapture(dataUrl);
    stopCamera();
  };

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative w-[140px] h-[140px] rounded-2xl overflow-hidden flex items-center justify-center"
        style={{
          border: `2px solid ${currentPhoto ? COPPER + "60" : "rgba(255,255,255,0.08)"}`,
          background: "rgba(255,255,255,0.03)",
        }}
      >
        {cameraActive ? (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        ) : currentPhoto ? (
          <img src={currentPhoto} alt="Patient" className="w-full h-full object-cover" />
        ) : (
          <div className="text-center">
            <div className="text-3xl mb-1 opacity-30">📷</div>
            <p className="text-[10px] text-[#64748B]">No Photo</p>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
      <div className="flex gap-2 mt-3">
        {cameraActive ? (
          <>
            <button
              type="button"
              onClick={capturePhoto}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all"
              style={{ background: COPPER }}
            >
              Capture
            </button>
            <button
              type="button"
              onClick={stopCamera}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#94A3B8] transition-all"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={startCamera}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#D4956B] transition-all hover:bg-[rgba(184,115,51,0.1)]"
            style={{ background: "rgba(184,115,51,0.06)", border: `1px solid ${COPPER}30` }}
          >
            {currentPhoto ? "Retake Photo" : "Open Camera"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Section Header ─── */
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h3 className="text-base font-display font-medium text-white tracking-tight">{title}</h3>
      {subtitle && <p className="text-xs text-[#94A3B8] mt-1">{subtitle}</p>}
      <div className="mt-3 h-[1px]" style={{ background: `linear-gradient(90deg, ${COPPER}40, transparent)` }} />
    </div>
  );
}

/* ─── Main Form ─── */
export function QuickForm({ onSubmit, loading }: QuickFormProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<QuickFormData>({
    fullName: "", dateOfBirth: "", gender: "", phone: "", insuranceId: "",
    chiefComplaint: "", department: "", photoUrl: "", maritalStatus: "",
    nationality: "Ghanaian", occupation: "", address: "", email: "",
    emergencyContactName: "", emergencyContactRelation: "", emergencyContactPhone: "",
    insuranceProvider: "", policyHolder: "", bloodType: "", allergies: "",
    currentMedications: "", chronicConditions: [], symptomDuration: "",
    symptomSeverity: 5, consentTreatment: false, consentPrivacy: false,
  });

  const update = (field: keyof QuickFormData, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const toggleCondition = (c: string) => {
    const current = form.chronicConditions || [];
    update("chronicConditions", current.includes(c) ? current.filter((x) => x !== c) : [...current, c]);
  };

  const canProceed = () => {
    switch (step) {
      case 1: return form.fullName.trim().length > 0;
      case 2: return true;
      case 3: return true;
      case 4: return true;
      case 5: return form.chiefComplaint.trim().length > 0 && form.department.length > 0;
      case 6: return form.consentTreatment && form.consentPrivacy;
      default: return true;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 6) { setStep(step + 1); return; }
    onSubmit(form);
  };

  const inputStyle = {
    background: "rgba(255,255,255,0.04)",
    borderColor: "rgba(184,115,51,0.15)",
    color: "white",
  };

  const textareaClass = "w-full rounded-xl border px-4 py-3 text-sm font-body text-white placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#B87333]/30 focus:border-[#B87333]/30 transition-all duration-300 resize-none";

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Progress Steps */}
      <div className="flex items-center gap-1 mb-8 px-1">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex-1 flex items-center">
            <button
              type="button"
              onClick={() => s.id < step && setStep(s.id)}
              className="flex items-center gap-2 w-full"
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 transition-all duration-300"
                style={{
                  background: step >= s.id ? COPPER : "rgba(255,255,255,0.05)",
                  color: step >= s.id ? "white" : "#64748B",
                  boxShadow: step === s.id ? `0 0 16px ${COPPER}40` : "none",
                }}
              >
                {step > s.id ? "✓" : s.icon}
              </div>
              <span className={`text-[10px] font-body hidden sm:block ${step >= s.id ? "text-[#D4956B]" : "text-[#64748B]"}`}>
                {s.label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-[1px] mx-2" style={{ background: step > s.id ? COPPER + "60" : "rgba(255,255,255,0.06)" }} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="min-h-[320px]"
        >
          {/* STEP 1: Identity */}
          {step === 1 && (
            <div>
              <SectionHeader title="Patient Identity" subtitle="Personal Details And Photo Capture" />
              <div className="flex gap-6">
                <div className="flex-1 space-y-4">
                  <Input dark id="fullName" label="Full Name *" placeholder="First Middle Last" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} required autoFocus />
                  <div className="grid grid-cols-2 gap-3">
                    <Input dark id="dob" label="Date Of Birth" type="date" value={form.dateOfBirth} onChange={(e) => update("dateOfBirth", e.target.value)} />
                    <Select dark id="gender" label="Gender" placeholder="Select..." options={[
                      { value: "male", label: "Male" },
                      { value: "female", label: "Female" },
                      { value: "other", label: "Other" },
                    ]} value={form.gender} onChange={(e) => update("gender", e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Select dark id="marital" label="Marital Status" placeholder="Select..." options={[
                      { value: "single", label: "Single" },
                      { value: "married", label: "Married" },
                      { value: "divorced", label: "Divorced" },
                      { value: "widowed", label: "Widowed" },
                    ]} value={form.maritalStatus || ""} onChange={(e) => update("maritalStatus", e.target.value)} />
                    <Input dark id="nationality" label="Nationality" value={form.nationality || ""} onChange={(e) => update("nationality", e.target.value)} />
                  </div>
                  <Input dark id="occupation" label="Occupation" placeholder="e.g. Teacher, Trader, Student" value={form.occupation || ""} onChange={(e) => update("occupation", e.target.value)} />
                </div>
                <div className="shrink-0 pt-6">
                  <CameraCapture
                    currentPhoto={form.photoUrl}
                    onCapture={(url) => update("photoUrl", url)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Contact */}
          {step === 2 && (
            <div>
              <SectionHeader title="Contact Information" subtitle="How To Reach The Patient And Emergency Contacts" />
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input dark id="phone" label="Phone Number *" placeholder="0XX-XXX-XXXX" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
                  <Input dark id="email" label="Email Address" placeholder="Optional" value={form.email || ""} onChange={(e) => update("email", e.target.value)} />
                </div>
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-[#94A3B8] font-body mb-1.5">Home Address</label>
                  <textarea id="address" rows={2} placeholder="Street, City, Region" value={form.address || ""} onChange={(e) => update("address", e.target.value)}
                    className={textareaClass} style={inputStyle} />
                </div>

                <div className="mt-2 pt-4" style={{ borderTop: "1px solid rgba(184,115,51,0.1)" }}>
                  <p className="text-xs font-mono text-[#B87333] uppercase tracking-wider mb-3">Emergency Contact</p>
                  <div className="grid grid-cols-3 gap-3">
                    <Input dark id="ecName" label="Contact Name" placeholder="Full name" value={form.emergencyContactName || ""} onChange={(e) => update("emergencyContactName", e.target.value)} />
                    <Select dark id="ecRelation" label="Relationship" placeholder="Select..." options={[
                      { value: "spouse", label: "Spouse" },
                      { value: "parent", label: "Parent" },
                      { value: "sibling", label: "Sibling" },
                      { value: "child", label: "Child" },
                      { value: "friend", label: "Friend" },
                      { value: "other", label: "Other" },
                    ]} value={form.emergencyContactRelation || ""} onChange={(e) => update("emergencyContactRelation", e.target.value)} />
                    <Input dark id="ecPhone" label="Phone" placeholder="0XX-XXX-XXXX" value={form.emergencyContactPhone || ""} onChange={(e) => update("emergencyContactPhone", e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Insurance */}
          {step === 3 && (
            <div>
              <SectionHeader title="Insurance & Billing" subtitle="NHIS Or Private Insurance Details" />
              <div className="space-y-4">
                <Select dark id="insuranceProvider" label="Insurance Provider" placeholder="Select provider..." options={[
                  { value: "nhis", label: "NHIS (National Health Insurance)" },
                  { value: "acacia", label: "Acacia Health Insurance" },
                  { value: "metropolitan", label: "Metropolitan Health" },
                  { value: "glico", label: "Glico Healthcare" },
                  { value: "enterprise", label: "Enterprise Life" },
                  { value: "star", label: "Star Assurance" },
                  { value: "self_pay", label: "Self Pay (No Insurance)" },
                  { value: "other", label: "Other" },
                ]} value={form.insuranceProvider || ""} onChange={(e) => update("insuranceProvider", e.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                  <Input dark id="insuranceId" label="Policy / Member ID" placeholder="Insurance card number" value={form.insuranceId} onChange={(e) => update("insuranceId", e.target.value)} />
                  <Input dark id="policyHolder" label="Policy Holder Name" placeholder="If different from patient" value={form.policyHolder || ""} onChange={(e) => update("policyHolder", e.target.value)} />
                </div>
                <div className="p-4 rounded-xl" style={{ background: "rgba(184,115,51,0.04)", border: `1px dashed ${COPPER}20` }}>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    <span className="text-[#B87333] font-medium">Verification:</span> Insurance eligibility will be verified automatically upon submission. If the patient is self-pay, proceed without insurance details.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Medical History */}
          {step === 4 && (
            <div>
              <SectionHeader title="Medical History" subtitle="Allergies, Medications, And Known Conditions" />
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Select dark id="bloodType" label="Blood Type" placeholder="If known..." options={[
                    { value: "A+", label: "A+" }, { value: "A-", label: "A-" },
                    { value: "B+", label: "B+" }, { value: "B-", label: "B-" },
                    { value: "AB+", label: "AB+" }, { value: "AB-", label: "AB-" },
                    { value: "O+", label: "O+" }, { value: "O-", label: "O-" },
                    { value: "unknown", label: "Unknown" },
                  ]} value={form.bloodType || ""} onChange={(e) => update("bloodType", e.target.value)} />
                  <Input dark id="allergies" label="Known Allergies" placeholder="e.g. Penicillin, Latex, None" value={form.allergies || ""} onChange={(e) => update("allergies", e.target.value)} />
                </div>
                <div>
                  <label htmlFor="meds" className="block text-sm font-medium text-[#94A3B8] font-body mb-1.5">Current Medications</label>
                  <textarea id="meds" rows={2} placeholder="List current medications and dosages, or 'None'" value={form.currentMedications || ""} onChange={(e) => update("currentMedications", e.target.value)}
                    className={textareaClass} style={inputStyle} />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#94A3B8] font-body mb-2">Chronic Conditions</p>
                  <div className="flex flex-wrap gap-2">
                    {CHRONIC_CONDITIONS.map((c) => {
                      const active = form.chronicConditions?.includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => toggleCondition(c)}
                          className="px-3 py-1.5 rounded-lg text-xs font-body transition-all duration-200"
                          style={{
                            background: active ? "rgba(184,115,51,0.15)" : "rgba(255,255,255,0.03)",
                            border: `1px solid ${active ? COPPER + "50" : "rgba(255,255,255,0.06)"}`,
                            color: active ? "#D4956B" : "#94A3B8",
                          }}
                        >
                          {active && "✓ "}{c}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Visit Reason */}
          {step === 5 && (
            <div>
              <SectionHeader title="Reason For Visit" subtitle="Chief Complaint, Symptoms, And Department Assignment" />
              <div className="space-y-4">
                <div>
                  <label htmlFor="complaint" className="block text-sm font-medium text-[#94A3B8] font-body mb-1.5">
                    Chief Complaint <span className="text-red-400">*</span>
                  </label>
                  <textarea id="complaint" rows={3} placeholder="Describe the patient's primary reason for visiting in their own words..." value={form.chiefComplaint} onChange={(e) => update("chiefComplaint", e.target.value)} required
                    className={textareaClass} style={inputStyle} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input dark id="duration" label="Symptom Duration" placeholder="e.g. 3 days, 2 weeks" value={form.symptomDuration || ""} onChange={(e) => update("symptomDuration", e.target.value)} />
                  <div>
                    <label className="block text-sm font-medium text-[#94A3B8] font-body mb-1.5">
                      Severity (1–10): <span className="font-mono text-[#B87333]">{form.symptomSeverity}</span>
                    </label>
                    <input
                      type="range" min={1} max={10} value={form.symptomSeverity || 5}
                      onChange={(e) => update("symptomSeverity", parseInt(e.target.value))}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                      style={{ accentColor: COPPER, background: "rgba(255,255,255,0.06)" }}
                    />
                    <div className="flex justify-between text-[9px] text-[#64748B] mt-1">
                      <span>Mild</span><span>Moderate</span><span>Severe</span>
                    </div>
                  </div>
                </div>
                <Select dark id="department" label="Department / Assignment *" placeholder="Select department..." options={DEPARTMENTS} value={form.department} onChange={(e) => update("department", e.target.value)} />
              </div>
            </div>
          )}

          {/* STEP 6: Consent */}
          {step === 6 && (
            <div>
              <SectionHeader title="Consent & Agreements" subtitle="Required Before Registration Can Be Completed" />
              <div className="space-y-4">
                <label className="flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all" style={{
                  background: form.consentTreatment ? "rgba(184,115,51,0.06)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${form.consentTreatment ? COPPER + "40" : "rgba(255,255,255,0.06)"}`,
                }}>
                  <input type="checkbox" checked={form.consentTreatment} onChange={(e) => update("consentTreatment", e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded" style={{ accentColor: COPPER }} />
                  <div>
                    <p className="text-sm font-body text-white font-medium">Consent To Treatment</p>
                    <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
                      I hereby consent to receive medical examination and treatment as deemed necessary by the attending physician. I understand that the practice of medicine is not an exact science and no guarantees have been made.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all" style={{
                  background: form.consentPrivacy ? "rgba(184,115,51,0.06)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${form.consentPrivacy ? COPPER + "40" : "rgba(255,255,255,0.06)"}`,
                }}>
                  <input type="checkbox" checked={form.consentPrivacy} onChange={(e) => update("consentPrivacy", e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded" style={{ accentColor: COPPER }} />
                  <div>
                    <p className="text-sm font-body text-white font-medium">Privacy Policy & Data Protection</p>
                    <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
                      I acknowledge that my personal and medical information will be stored securely in compliance with the Ghana Data Protection Act 2012. My records are protected by permanent audit trails and encrypted storage.
                    </p>
                  </div>
                </label>

                <div className="p-4 rounded-xl" style={{ background: "rgba(184,115,51,0.04)", border: `1px solid ${COPPER}15` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-[#B87333]" style={{ boxShadow: `0 0 8px ${COPPER}60` }} />
                    <p className="text-xs font-mono text-[#B87333] uppercase tracking-wider">Audit Notice</p>
                  </div>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    This registration is permanently logged with timestamp, device ID, and operator identity. All records are immutable and subject to audit by hospital administration and Dalxic Master Control.
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-5" style={{ borderTop: "1px solid rgba(184,115,51,0.1)" }}>
        <div>
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-5 py-2.5 rounded-xl text-sm font-body text-[#94A3B8] transition-all hover:text-white"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              ← Back
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#64748B] font-mono">
            Step {step} Of {STEPS.length}
          </span>
          <Button
            type="submit"
            variant="copper"
            size="lg"
            loading={loading}
            disabled={!canProceed()}
          >
            {step < 6 ? "Continue →" : "Register Patient & Assign Queue"}
          </Button>
        </div>
      </div>
    </motion.form>
  );
}
