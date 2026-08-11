const PENDING_PHONE_KEY = 'ennitant_pending_phone'
const PENDING_OTP_KEY = 'ennitant_pending_otp'

export const COUNTRY_CODES = [
  { code: '+92', label: 'PK (+92)' },
  { code: '+1', label: 'US/CA (+1)' },
  { code: '+44', label: 'UK (+44)' },
  { code: '+971', label: 'AE (+971)' },
  { code: '+966', label: 'SA (+966)' },
  { code: '+91', label: 'IN (+91)' },
  { code: '+61', label: 'AU (+61)' },
] as const

export function normalizePhone(countryCode: string, localNumber: string): string {
  const code = countryCode.startsWith('+') ? countryCode : `+${countryCode}`
  const codeDigits = code.replace(/\D/g, '')
  let digits = localNumber.replace(/\D/g, '')

  // If user pasted a full international number into the local field, strip CC.
  if (digits.startsWith(codeDigits)) {
    digits = digits.slice(codeDigits.length)
  }

  // Drop trunk prefix "0" (e.g. PK 0313... with +92 → +92313..., not +920313...).
  digits = digits.replace(/^0+/, '')

  return `${code}${digits}`
}

export function splitPhone(phone: string): { countryCode: string; localNumber: string } {
  const normalized = phone.trim().startsWith('+') ? phone.trim() : `+${phone.trim()}`
  const match = COUNTRY_CODES.find((item) => normalized.startsWith(item.code))
  if (match) {
    return {
      countryCode: match.code,
      localNumber: normalized.slice(match.code.length).replace(/\D/g, ''),
    }
  }
  return {
    countryCode: '+92',
    localNumber: normalized.replace(/^\+/, '').replace(/\D/g, ''),
  }
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 6) return phone
  const visibleStart = phone.startsWith('+') ? `+${digits.slice(0, 2)}` : digits.slice(0, 2)
  const visibleEnd = digits.slice(-4)
  return `${visibleStart} XXX ${visibleEnd}`
}

export const pendingPhoneStorage = {
  get(): string | null {
    try {
      return localStorage.getItem(PENDING_PHONE_KEY)
    } catch {
      return null
    }
  },
  set(phone: string) {
    localStorage.setItem(PENDING_PHONE_KEY, phone)
  },
  clear() {
    localStorage.removeItem(PENDING_PHONE_KEY)
  },
}

/** Local/dev only: OTP is not sent via SMS unless a provider is configured. */
export const pendingOtpStorage = {
  get(): string | null {
    try {
      return localStorage.getItem(PENDING_OTP_KEY)
    } catch {
      return null
    }
  },
  set(code: string) {
    localStorage.setItem(PENDING_OTP_KEY, code)
  },
  clear() {
    localStorage.removeItem(PENDING_OTP_KEY)
  },
}
