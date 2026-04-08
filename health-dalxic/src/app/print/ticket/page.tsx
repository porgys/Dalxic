"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import QRCode from "qrcode";

interface TicketData {
  token: string;
  patientName: string;
  department: string;
  chiefComplaint: string;
  emergencyFlag: boolean;
  symptomSeverity: number | null;
  createdAt: string;
  assignedDoctor?: string;
  hospitalName: string;
}

function TicketContent() {
  const searchParams = useSearchParams();
  const tokenId = searchParams.get("tokenId");
  const hospitalCode = searchParams.get("hospitalCode") || "KBH";
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [qrSvg, setQrSvg] = useState<string>("");
  const printed = useRef(false);

  useEffect(() => {
    if (!tokenId) return;

    async function loadTicket() {
      try {
        const res = await fetch(`/api/queue?hospitalCode=${hospitalCode}`);
        if (!res.ok) return;
        const data = await res.json();
        const match = data.find((d: { token: string }) => d.token === tokenId);
        if (match) {
          setTicket({
            token: match.token,
            patientName: match.patientName,
            department: match.department,
            chiefComplaint: match.chiefComplaint,
            emergencyFlag: match.emergencyFlag,
            symptomSeverity: match.symptomSeverity,
            createdAt: match.createdAt,
            hospitalName: "Korle Bu Teaching Hospital",
          });
        }
      } catch { /* silent */ }
    }

    loadTicket();
  }, [tokenId, hospitalCode]);

  // Generate QR code
  useEffect(() => {
    if (!ticket) return;
    const statusUrl = `${window.location.origin}/queue/status/${encodeURIComponent(ticket.token)}`;
    QRCode.toString(statusUrl, { type: "svg", width: 120, margin: 1 })
      .then((svg) => setQrSvg(svg))
      .catch(() => {});
  }, [ticket]);

  // Auto-print when loaded
  useEffect(() => {
    if (ticket && qrSvg && !printed.current) {
      printed.current = true;
      setTimeout(() => window.print(), 500);
    }
  }, [ticket, qrSvg]);

  if (!tokenId) {
    return <p style={{ padding: 24, fontFamily: "monospace" }}>No tokenId provided</p>;
  }

  if (!ticket) {
    return <p style={{ padding: 24, fontFamily: "monospace" }}>Loading ticket...</p>;
  }

  const time = new Date(ticket.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const date = new Date(ticket.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const waitEstimate = ticket.emergencyFlag ? "PRIORITY" : "~15 min";

  return (
    <>
      <style>{`
        @media print {
          @page { size: 80mm auto; margin: 0; }
          body { margin: 0; padding: 0; }
          .no-print { display: none !important; }
        }
        body { margin: 0; padding: 0; background: white; }
        .ticket {
          width: 80mm;
          max-width: 80mm;
          margin: 0 auto;
          padding: 6mm 4mm;
          font-family: "Courier New", Courier, monospace;
          color: #000;
          background: white;
        }
        .ticket-header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 4mm; margin-bottom: 4mm; }
        .hospital-name { font-size: 11px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 2px; }
        .hospital-sub { font-size: 8px; color: #666; letter-spacing: 0.5px; }
        .token-number { font-size: 48px; font-weight: bold; text-align: center; margin: 4mm 0; letter-spacing: 2px; }
        .token-emergency { color: #c00; }
        .emergency-badge { display: inline-block; font-size: 10px; font-weight: bold; padding: 1mm 3mm; border: 1px solid #c00; color: #c00; letter-spacing: 1px; margin-bottom: 2mm; }
        .field { display: flex; justify-content: space-between; font-size: 9px; margin-bottom: 1.5mm; }
        .field-label { color: #666; text-transform: uppercase; font-size: 8px; letter-spacing: 0.5px; }
        .field-value { font-weight: bold; text-align: right; max-width: 60%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .divider { border: none; border-top: 1px dashed #000; margin: 4mm 0; }
        .qr-section { text-align: center; margin: 3mm 0; }
        .qr-label { font-size: 7px; color: #666; margin-top: 1mm; letter-spacing: 0.5px; }
        .footer { text-align: center; font-size: 7px; color: #999; margin-top: 3mm; padding-top: 3mm; border-top: 1px dashed #ccc; }
        .reprint-btn { display: block; margin: 16px auto; padding: 8px 24px; font-size: 14px; cursor: pointer; background: #333; color: white; border: none; border-radius: 4px; }
      `}</style>

      <div className="ticket">
        <div className="ticket-header">
          <div className="hospital-name">{ticket.hospitalName}</div>
          <div className="hospital-sub">DalxicHealth System</div>
        </div>

        {ticket.emergencyFlag && (
          <div style={{ textAlign: "center" }}>
            <span className="emergency-badge">EMERGENCY</span>
          </div>
        )}

        <div className={`token-number ${ticket.emergencyFlag ? "token-emergency" : ""}`}>
          {ticket.token}
        </div>

        <div className="field">
          <span className="field-label">Patient</span>
          <span className="field-value">{ticket.patientName}</span>
        </div>
        <div className="field">
          <span className="field-label">Department</span>
          <span className="field-value">{ticket.department}</span>
        </div>
        {ticket.assignedDoctor && (
          <div className="field">
            <span className="field-label">Doctor</span>
            <span className="field-value">{ticket.assignedDoctor}</span>
          </div>
        )}
        <div className="field">
          <span className="field-label">Date</span>
          <span className="field-value">{date}</span>
        </div>
        <div className="field">
          <span className="field-label">Time</span>
          <span className="field-value">{time}</span>
        </div>
        <div className="field">
          <span className="field-label">Est. Wait</span>
          <span className="field-value">{waitEstimate}</span>
        </div>

        <hr className="divider" />

        <div className="qr-section">
          <div dangerouslySetInnerHTML={{ __html: qrSvg }} />
          <div className="qr-label">SCAN TO TRACK YOUR QUEUE STATUS</div>
        </div>

        <div className="footer">
          <div>Keep this ticket — your number will be called</div>
          <div style={{ marginTop: "1mm" }}>Powered by DalxicHealth &bull; Dalxic</div>
        </div>
      </div>

      <button type="button" className="no-print reprint-btn" onClick={() => window.print()}>
        Print Again
      </button>
    </>
  );
}

export default function PrintTicketPage() {
  return (
    <Suspense fallback={<p style={{ padding: 24, fontFamily: "monospace" }}>Loading...</p>}>
      <TicketContent />
    </Suspense>
  );
}
