// Constantes, formats et validateurs du module SALM, communs au client et au serveur.

// ---- Codes d'erreur de champ (contracts/public-api.md) ----

export type SalmFieldError =
  | 'REQUIRED'
  | 'TOO_SHORT'
  | 'TOO_LONG'
  | 'INVALID_CHARS'
  | 'INVALID_FORMAT'
  | 'INVALID_CHOICE'
  | 'TOO_MANY'
  | 'DUPLICATE'

// ---- Listes fermées ----

export const SCHOOL_PROGRAMMES = ['BACHELOR', 'BTS', 'LICENCE', 'MASTER', 'AUTRE'] as const
export type SchoolProgramme = (typeof SCHOOL_PROGRAMMES)[number]
export const SCHOOL_PROGRAMME_LABELS: Record<SchoolProgramme, string> = {
  BACHELOR: 'BACHELOR',
  BTS: 'BTS',
  LICENCE: 'LICENCE',
  MASTER: 'MASTER',
  AUTRE: 'Autre',
}

export const SCHOOL_STATUSES = ['nouvelle', 'contactee', 'confirmee', 'annulee'] as const
export type SchoolStatus = (typeof SCHOOL_STATUSES)[number]
export const SCHOOL_STATUS_LABELS: Record<SchoolStatus, string> = {
  nouvelle: 'Nouvelle',
  contactee: 'Contactée',
  confirmee: 'Confirmée',
  annulee: 'Annulée',
}

export const SLOT_KINDS = ['ceremonie', 'panel', 'presentation', 'stands', 'pause', 'exposition'] as const
export type SlotKind = (typeof SLOT_KINDS)[number]

export const SCHOOL_MAX_EXHIBITORS = 6
export const STUDENT_NAME_MAX = 60

export function programmeLabel(code: string): string {
  return SCHOOL_PROGRAMME_LABELS[code as SchoolProgramme] ?? code
}

export function schoolStatusLabel(code: string): string {
  return SCHOOL_STATUS_LABELS[code as SchoolStatus] ?? code
}

// ---- Badge ----

/** `(2027, 482)` → `SALM27-000482` */
export function formatBadgeNumber(year: number, seq: number): string {
  return `SALM${String(year).slice(-2)}-${String(seq).padStart(6, '0')}`
}

// ---- Nom de l'étudiant·e (FR-020a) ----

const NAME_ALLOWED = /^[\p{L}\p{M} .'’-]+$/u
const LETTER = /\p{L}/gu

export function collapseSpaces(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim()
}

export function validateStudentName(raw: unknown): { value: string } | { error: SalmFieldError } {
  if (typeof raw !== 'string') return { error: 'REQUIRED' }
  const value = collapseSpaces(raw)
  if (!value) return { error: 'REQUIRED' }
  if (!NAME_ALLOWED.test(value)) return { error: 'INVALID_CHARS' }
  if ([...value].length > STUDENT_NAME_MAX) return { error: 'TOO_LONG' }
  if ([...value].length < 2 || (value.match(LETTER)?.length ?? 0) < 2) return { error: 'TOO_SHORT' }
  return { value }
}

function normalizeName(name: string): string[] {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
}

/** Clé de comparaison : « KOUASSI Aya-Marie » et « aya marie kouassi » → `aya kouassi marie` (FR-025). */
export function nameMatchKey(name: string): string {
  return normalizeName(name).sort().join(' ')
}

/** Clé de recherche admin, sans tri : minuscules, sans accents (research R6). */
export function nameSearchKey(name: string): string {
  return normalizeName(name).join(' ')
}

// ---- YouTube (research R7) ----

const YOUTUBE_HOSTS = ['youtube.com', 'music.youtube.com', 'youtube-nocookie.com', 'youtu.be']
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/

/**
 * Identifiant YouTube d'une URL `youtu.be/ID`, `/watch?v=ID`, `/embed/ID`, `/shorts/ID` ou `/live/ID`,
 * sur un hôte YouTube uniquement ; `null` pour toute autre adresse.
 */
export function parseYoutubeId(url: string | null | undefined): string | null {
  const raw = url?.trim()
  if (!raw) return null
  let u: URL
  try {
    u = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`)
  }
  catch {
    return null
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null
  const host = u.hostname.toLowerCase().replace(/^(www|m)\./, '')
  if (!YOUTUBE_HOSTS.includes(host)) return null
  const segments = u.pathname.split('/').filter(Boolean)
  let id: string | null | undefined
  if (host === 'youtu.be') id = segments[0]
  else if (segments[0] === 'watch' && segments.length === 1) id = u.searchParams.get('v')
  else if (['embed', 'shorts', 'live'].includes(segments[0] ?? '')) id = segments[1]
  return id && YOUTUBE_ID.test(id) ? id : null
}

/** `dQw4w9WgXcQ` → `https://www.youtube.com/watch?v=dQw4w9WgXcQ` (forme stockée). */
export function canonicalYoutubeUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`
}

// ---- E-mail ----

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(value: string): boolean {
  return value.length <= 254 && EMAIL_REGEX.test(value)
}

// ---- Chronogramme ----

export const SLOT_KIND_LABELS: Record<SlotKind, string> = {
  ceremonie: 'Cérémonie',
  panel: 'Panel',
  presentation: 'Présentation',
  stands: 'Stands',
  pause: 'Pause',
  exposition: 'Exposition',
}

/**
 * Chevauchements stricts entre créneaux d'un même jour (FR-153) : `a` et `b` se chevauchent si
 * `a.startTime < b.endTime && b.startTime < a.endTime`. Des créneaux qui se touchent ne se chevauchent pas.
 * Renvoie, pour chaque créneau concerné, les identifiants des créneaux qu'il chevauche.
 */
export function findSlotOverlaps<Id>(slots: { id: Id; startTime: string; endTime: string }[]): Map<Id, Id[]> {
  const overlaps = new Map<Id, Id[]>()
  for (const [i, a] of slots.entries()) {
    for (const b of slots.slice(i + 1)) {
      if (a.startTime < b.endTime && b.startTime < a.endTime) {
        overlaps.set(a.id, [...(overlaps.get(a.id) ?? []), b.id])
        overlaps.set(b.id, [...(overlaps.get(b.id) ?? []), a.id])
      }
    }
  }
  return overlaps
}

// ---- Dates et heures (Abidjan = UTC+0) ----

/** `09:30` → `9h30`, `16:00` → `16h00` */
export function formatHour(hhmm: string): string {
  const [h, m] = hhmm.split(':')
  return `${Number(h)}h${m}`
}

function utcDate(date: string): Date {
  return new Date(`${date}T12:00:00Z`)
}

/** `2027-03-12` → `vendredi 12 mars 2027` */
export function formatDayLong(date: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(utcDate(date))
}

/** `2027-03-12` → `ven. 12 mars` */
export function formatDayShort(date: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'long',
  }).format(utcDate(date))
}

/** `2027-03-12` → `ven. 12` (onglets mobiles) */
export function formatDayTab(date: string): string {
  return new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', weekday: 'short', day: 'numeric' }).format(utcDate(date))
}

/** `2027-03-12` → `12 mars 2027` */
export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' })
    .format(utcDate(date))
}

/**
 * Plage de dates : `12 et 13 mars 2027` (2 jours du même mois), `12 – 14 mars 2027`, ou une seule date.
 * `and` remplace « et » (ex. `&`).
 */
export function formatDateRange(dates: string[], and = 'et'): string {
  if (!dates.length) return ''
  const first = dates[0]!
  const last = dates[dates.length - 1]!
  if (first === last) return formatDate(first)
  const [y1, m1] = first.split('-')
  const [y2, m2] = last.split('-')
  const d1 = Number(first.slice(8))
  if (y1 === y2 && m1 === m2) return `${d1} ${dates.length === 2 ? and : '–'} ${formatDate(last)}`
  return `${formatDate(first)} – ${formatDate(last)}`
}

function capitalize(text: string): string {
  return text.charAt(0).toLocaleUpperCase('fr-FR') + text.slice(1)
}

/** `['2027-03-12', '2027-03-13']` → `Vendredi 12 & samedi 13 mars 2027` */
export function formatDaysSentence(dates: string[]): string {
  if (!dates.length) return ''
  const sameMonth = dates.every((d) => d.slice(0, 7) === dates[0]!.slice(0, 7))
  const weekdayDay = new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', weekday: 'long', day: 'numeric' })
  const monthYear = new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', month: 'long', year: 'numeric' })
  const parts = sameMonth ? dates.map((d) => weekdayDay.format(utcDate(d))) : dates.map(formatDayLong)
  const joined = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} & ${parts.at(-1)}` : parts[0]!
  return capitalize(sameMonth ? `${joined} ${monthYear.format(utcDate(dates[0]!))}` : joined)
}

/**
 * Intitulé du salon en capitales, découpé comme sur la maquette :
 * `SALON INTERNATIONAL DES LICENCES ET MASTERS` + `DE CÔTE D'IVOIRE`.
 */
export function splitSalonName(salonName: string): { main: string; sub: string | null } {
  const upper = salonName.toLocaleUpperCase('fr-FR')
  const match = upper.match(/^(.*?)\s+(DE CÔTE D['’]IVOIRE)$/)
  return match ? { main: match[1]!, sub: match[2]! } : { main: upper, sub: null }
}

/** Libellé de lieu : lieu saisi, sinon « Lieu à confirmer, <ville> » (FR-004). */
export function venueLabel(venue: string | null | undefined, city: string): string {
  return venue ? `${venue}, ${city}` : `Lieu à confirmer, ${city}`
}
