// Ghana tax rates
const VAT_RATE = 0.15
const NHIL_RATE = 0.025
const GETFUND_RATE = 0.025
const COVID_RATE = 0.01

export interface TaxBreakdown {
  vat: number
  nhil: number
  getfund: number
  covid: number
  total: number
}

export function calculateTax(subtotal: number, taxConfig?: Record<string, number> | null): TaxBreakdown {
  const vat = Math.round(subtotal * (taxConfig?.vat ?? VAT_RATE * 100) / 100)
  const nhil = Math.round(subtotal * (taxConfig?.nhil ?? NHIL_RATE * 100) / 100)
  const getfund = Math.round(subtotal * (taxConfig?.getfund ?? GETFUND_RATE * 100) / 100)
  const covid = Math.round(subtotal * (taxConfig?.covid ?? COVID_RATE * 100) / 100)
  return { vat, nhil, getfund, covid, total: vat + nhil + getfund + covid }
}

// PAYE monthly brackets (amounts in pesewas)
const PAYE_BRACKETS = [
  { limit: 490_00, rate: 0 },
  { limit: 600_00, rate: 0.05 },
  { limit: 730_00, rate: 0.10 },
  { limit: 3896_00, rate: 0.175 },
  { limit: 20000_00, rate: 0.25 },
  { limit: 50000_00, rate: 0.30 },
  { limit: Infinity, rate: 0.35 },
]

// SSNIT rates
const SSNIT = {
  T1: { employer: 0.13, employee: 0.055 },
  T2: { employer: 0.05, employee: 0.055 },
}

export interface PayrollBreakdown {
  grossPay: number
  ssnitEmployee: number
  ssnitEmployer: number
  taxableIncome: number
  paye: number
  netPay: number
}

export function calculatePayroll(baseSalary: number, allowances: number, ssnitTier: "T1" | "T2"): PayrollBreakdown {
  const grossPay = baseSalary + allowances
  const rates = SSNIT[ssnitTier]
  const ssnitEmployee = Math.round(grossPay * rates.employee)
  const ssnitEmployer = Math.round(grossPay * rates.employer)
  const taxableIncome = grossPay - ssnitEmployee

  let paye = 0
  let remaining = taxableIncome
  let prevLimit = 0
  for (const bracket of PAYE_BRACKETS) {
    const bracketSize = bracket.limit - prevLimit
    const taxable = Math.min(remaining, bracketSize)
    paye += Math.round(taxable * bracket.rate)
    remaining -= taxable
    prevLimit = bracket.limit
    if (remaining <= 0) break
  }

  return {
    grossPay,
    ssnitEmployee,
    ssnitEmployer,
    taxableIncome,
    paye,
    netPay: grossPay - ssnitEmployee - paye,
  }
}
