/**
 * Receipt code generator — unique, human-readable receipt numbers.
 * Format: ORG-YYYYMMDD-XXXX (e.g., KBH-20260413-0042)
 */

/** Generate a receipt code for a sale */
export function generateReceiptCode(orgCode: string, sequenceNumber: number): string {
  const today = new Date();
  const date = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("");

  const seq = String(sequenceNumber).padStart(4, "0");
  return `${orgCode.toUpperCase()}-${date}-${seq}`;
}

/** Extract the date portion from a receipt code */
export function receiptDate(code: string): string | null {
  const match = code.match(/-(\d{8})-/);
  if (!match) return null;
  const d = match[1];
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
}
