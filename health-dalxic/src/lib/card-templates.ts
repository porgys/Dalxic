/**
 * CR80 card templates for the Cards & Bookings workstation.
 *
 * Standard CR80 ID card: 85.60mm × 53.98mm.
 * Every template returns a self-contained HTML string designed to be printed
 * at exactly CR80 dimensions via `@page size: 85.60mm 53.98mm`.
 *
 * The hospital picks a built-in preset (key) OR supplies a custom template
 * that overrides the background image and positions fields by coordinates.
 */

export type CardData = {
  cardNumber: string;
  patientName: string;
  phone?: string | null;
  dateOfBirth?: string | null;
  hospitalName: string;
  hospitalCode?: string;
};

export type CustomTemplate = {
  bg: string;
  fields: {
    key: "cardNumber" | "patientName" | "phone" | "dateOfBirth" | "hospitalName";
    x: number;
    y: number;
    fontSize?: number;
    color?: string;
    weight?: number;
    align?: "left" | "center" | "right";
  }[];
};

export type TemplateKey = "classic_copper" | "photo_id" | "minimal_clinical" | "premium_black" | "custom";

export const TEMPLATE_LIST: { key: TemplateKey; label: string; tagline: string }[] = [
  { key: "classic_copper", label: "Classic Copper", tagline: "Warm metallic gradient. The signature DalxicHealth card." },
  { key: "photo_id", label: "Photo-ID", tagline: "Photo placeholder + credential layout. Looks official." },
  { key: "minimal_clinical", label: "Minimal Clinical", tagline: "Crisp white, single accent line. For modern clinics." },
  { key: "premium_black", label: "Premium Black", tagline: "Matte black + copper foil feel. Flagship tier." },
];

/* ─── CR80 shell ─── */
function shell(inner: string, bg: string, autoPrint: boolean) {
  return `<!doctype html><html><head><meta charset="utf-8">
<title>DalxicHealth Card</title>
<style>
  @page { size: 85.60mm 53.98mm; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { width: 85.60mm; height: 53.98mm; font-family: -apple-system, Segoe UI, sans-serif; }
  .card { width: 85.60mm; height: 53.98mm; padding: 6mm; position: relative; color: #fff; overflow: hidden; ${bg} }
  .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: 0.08em; }
  .no-print { position: fixed; bottom: 8px; right: 8px; font: 11px -apple-system; background: #0F172A; color: #fff; padding: 6px 10px; border-radius: 6px; border: none; cursor: pointer; }
  @media print { .no-print { display: none; } body { background: transparent; } }
  @media screen { body { padding: 24px; background: #0F172A; } }
</style>
</head><body>
<div class="card">${inner}</div>
<button class="no-print" id="print-btn" onclick="window.print()">Print to Card Printer</button>
<script>if(window.self!==window.top){var b=document.getElementById('print-btn');if(b)b.style.display='none';}${autoPrint ? "setTimeout(function(){window.print()},450);" : ""}</script>
</body></html>`;
}

function escape(s: string | null | undefined) {
  if (!s) return "";
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

/* ─── Built-in presets ─── */
function classicCopper(d: CardData, autoPrint: boolean) {
  return shell(`
    <div style="position:absolute;top:5mm;left:6mm;right:6mm;display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:2.6mm;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;opacity:0.9">${escape(d.hospitalName)}</span>
      <span style="font-size:2.2mm;font-weight:700;letter-spacing:0.2em;opacity:0.75">DALXICHEALTH</span>
    </div>
    <div style="position:absolute;bottom:6mm;left:6mm;right:6mm">
      <div class="mono" style="font-size:5.5mm;font-weight:800">${escape(d.cardNumber)}</div>
      <div style="font-size:3.2mm;font-weight:700;margin-top:1mm">${escape(d.patientName)}</div>
      <div style="display:flex;gap:5mm;margin-top:1mm;font-size:2.4mm;opacity:0.82">
        ${d.phone ? `<span>📞 ${escape(d.phone)}</span>` : ""}
        ${d.dateOfBirth ? `<span>🎂 ${escape(d.dateOfBirth)}</span>` : ""}
      </div>
    </div>
  `, "background: linear-gradient(135deg, #B87333 0%, #8B5A24 60%, #5C3D1A 100%);", autoPrint);
}

function photoId(d: CardData, autoPrint: boolean) {
  return shell(`
    <div style="display:flex;height:100%;gap:4mm">
      <div style="width:22mm;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:2mm;display:flex;align-items:center;justify-content:center;font-size:9mm;opacity:0.4">👤</div>
      <div style="flex:1;display:flex;flex-direction:column;justify-content:space-between;padding:1mm 0">
        <div>
          <div style="font-size:2.3mm;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;opacity:0.85">${escape(d.hospitalName)}</div>
          <div style="font-size:1.8mm;font-weight:600;opacity:0.6;margin-top:0.5mm">Patient Identification Card</div>
        </div>
        <div>
          <div style="font-size:3.5mm;font-weight:800">${escape(d.patientName)}</div>
          <div class="mono" style="font-size:4.2mm;color:#D4956B;margin-top:1mm">${escape(d.cardNumber)}</div>
          ${d.dateOfBirth ? `<div style="font-size:2mm;opacity:0.7;margin-top:0.8mm">DOB · ${escape(d.dateOfBirth)}</div>` : ""}
        </div>
      </div>
    </div>
  `, "background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);", autoPrint);
}

function minimalClinical(d: CardData, autoPrint: boolean) {
  return shell(`
    <div style="height:100%;color:#0D0A07;display:flex;flex-direction:column;justify-content:space-between">
      <div>
        <div style="font-size:2.6mm;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#5C3D1A">${escape(d.hospitalName)}</div>
        <div style="height:1px;background:#B87333;margin-top:2mm;width:14mm"></div>
      </div>
      <div>
        <div style="font-size:2mm;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;opacity:0.55">Patient</div>
        <div style="font-size:4.2mm;font-weight:800;margin-top:0.5mm">${escape(d.patientName)}</div>
        <div class="mono" style="font-size:3.4mm;font-weight:700;margin-top:1.5mm;color:#8B5A24">${escape(d.cardNumber)}</div>
      </div>
    </div>
  `, "background: #F5F1EA;", autoPrint);
}

function premiumBlack(d: CardData, autoPrint: boolean) {
  return shell(`
    <div style="height:100%;display:flex;flex-direction:column;justify-content:space-between">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div style="font-size:2.1mm;font-weight:800;letter-spacing:0.22em;text-transform:uppercase;background:linear-gradient(135deg,#D4956B,#B87333);-webkit-background-clip:text;-webkit-text-fill-color:transparent">${escape(d.hospitalName)}</div>
          <div style="font-size:1.6mm;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;opacity:0.5;margin-top:0.8mm">Premium Member</div>
        </div>
        <div style="font-size:3mm;opacity:0.6">✦</div>
      </div>
      <div>
        <div class="mono" style="font-size:5.8mm;font-weight:800;background:linear-gradient(135deg,#D4956B,#B87333);-webkit-background-clip:text;-webkit-text-fill-color:transparent">${escape(d.cardNumber)}</div>
        <div style="font-size:3mm;font-weight:700;margin-top:1.2mm">${escape(d.patientName)}</div>
        ${d.phone ? `<div style="font-size:2.2mm;opacity:0.55;margin-top:0.6mm">${escape(d.phone)}</div>` : ""}
      </div>
    </div>
  `, "background: radial-gradient(ellipse at top right, #1a0f05 0%, #000 60%);", autoPrint);
}

/* ─── Custom template renderer ─── */
function renderCustom(d: CardData, tpl: CustomTemplate, autoPrint: boolean): string {
  const valueFor = (key: CustomTemplate["fields"][number]["key"]): string => {
    switch (key) {
      case "cardNumber": return d.cardNumber;
      case "patientName": return d.patientName;
      case "phone": return d.phone || "";
      case "dateOfBirth": return d.dateOfBirth || "";
      case "hospitalName": return d.hospitalName;
    }
  };
  const fieldHtml = tpl.fields.map((f) => `
    <div style="position:absolute;left:${f.x}mm;top:${f.y}mm;color:${f.color || "#fff"};font-size:${f.fontSize || 3}mm;font-weight:${f.weight || 700};text-align:${f.align || "left"}">
      ${escape(valueFor(f.key))}
    </div>`).join("");
  return shell(`
    <img src="${tpl.bg}" style="position:absolute;inset:0;width:85.60mm;height:53.98mm;object-fit:cover" />
    ${fieldHtml}
  `, "background: #000;", autoPrint);
}

/* ─── Public entrypoint ─── */
export function renderCard(
  data: CardData,
  templateKey: TemplateKey = "classic_copper",
  customTemplate?: CustomTemplate | null,
  autoPrint: boolean = false,
): string {
  if (templateKey === "custom" && customTemplate) return renderCustom(data, customTemplate, autoPrint);
  switch (templateKey) {
    case "photo_id": return photoId(data, autoPrint);
    case "minimal_clinical": return minimalClinical(data, autoPrint);
    case "premium_black": return premiumBlack(data, autoPrint);
    case "classic_copper":
    default: return classicCopper(data, autoPrint);
  }
}
