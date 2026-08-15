export function toWaMeUrl(phone?: string | null): string | null {
  if (!phone) return null
  let digits = phone.replace(/\D/g, '')
  if (digits.startsWith('92') && digits.length > 3 && digits[2] === '0') {
    digits = `92${digits.slice(3)}`
  }
  if (digits.startsWith('0')) {
    digits = digits.replace(/^0+/, '')
  }
  if (digits.length < 8) return null
  return `https://wa.me/${digits}`
}
