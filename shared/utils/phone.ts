// Numéros ivoiriens (research R6).

// Règle historique du module magazine, reprise à l'identique.
export const IVORIAN_PHONE_REGEX = /^(01|05|07|27)\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}$/

const MOBILE_REGEX = /^(01|05|07|27)\d{8}$/
const LANDLINE_REGEX = /^(01|05|07|21|25|27)\d{8}$/

/**
 * Normalise un numéro ivoirien en 10 chiffres, ou renvoie `null` s'il est invalide.
 * Accepte espaces, points, tirets, parenthèses et les préfixes +225 / 00225.
 * `landline` admet aussi les fixes 21 et 25 (établissements et exposants).
 */
export function normalizeIvorianPhone(raw: unknown, { landline = false }: { landline?: boolean } = {}): string | null {
  if (typeof raw !== 'string') return null
  let digits = raw.replace(/[\s.\-()]/g, '')
  if (digits.startsWith('+225') && digits.length === 14) digits = digits.slice(4)
  else if (digits.startsWith('00225') && digits.length === 15) digits = digits.slice(5)
  return (landline ? LANDLINE_REGEX : MOBILE_REGEX).test(digits) ? digits : null
}

/** `0712345678` → `07 12 34 56 78` */
export function formatIvorianPhone(phone: string): string {
  return /^\d{10}$/.test(phone) ? phone.replace(/(\d{2})(?=\d)/g, '$1 ') : phone
}
