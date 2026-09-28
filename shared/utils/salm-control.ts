import { normalizeIvorianPhone } from './phone'
import type { SalmControlRefusal, SalmControlStatus } from '../types/salm'

// Contrôle d'entrée SALM : règles communes au serveur et au poste hors ligne (specs/008, R5, R9, R10).
// Fonctions pures, sans accès à la base.

// ---- Lecture du QR code (R10) ----

const VERIFY_URL_TOKEN = /\/salm\/v\/([A-Za-z0-9_-]{22})(?:[/?#]|$)/

/** Jeton d'un badge SALM dans le texte lu (`…/salm/v/<jeton>`), quel que soit le domaine ; sinon `null`. */
export function extractVerifyToken(text: string): string | null {
  return VERIFY_URL_TOKEN.exec(text.trim())?.[1] ?? null
}

// ---- Saisie manuelle (FR-218, FR-219) ----

export type ControlQuery = { kind: 'badge'; seq: number } | { kind: 'phone'; phone: string }

/**
 * Numéro de badge (`SALM27-000482`, `salm27 482`, `000482`, `482`) ou téléphone ivoirien.
 * Un préfixe `SALMxx` d'une autre année que `year` donne `null`, comme une saisie illisible.
 */
export function parseControlQuery(q: string, year: number): ControlQuery | null {
  const compact = q.replace(/[\s.-]/g, '').toUpperCase()
  const prefixed = /^SALM(\d{2})(\d{1,6})$/.exec(compact)
  if (prefixed) {
    if (prefixed[1] !== String(year).slice(-2)) return null
    const seq = Number(prefixed[2])
    return seq >= 1 ? { kind: 'badge', seq } : null
  }
  if (/^\d{1,6}$/.test(compact)) {
    const seq = Number(compact)
    return seq >= 1 ? { kind: 'badge', seq } : null
  }
  const phone = normalizeIvorianPhone(q)
  return phone ? { kind: 'phone', phone } : null
}

// ---- Jour contrôlé (R9) ----

/** Date UTC du jour (`AAAA-MM-JJ`), heure d'Abidjan. */
export function todayIso(now = new Date()): string {
  return now.toISOString().slice(0, 10)
}

/** Jour de salon à la date du jour, sinon `null` (mode essai). */
export function controlDayFor<T extends { id: number; date: string }>(days: T[], now = new Date()): T | null {
  const today = todayIso(now)
  return days.find((d) => d.date === today) ?? null
}

// ---- Empreinte du jeton (R5) ----

/** `base64url(SHA-256(jeton)[0..16])` : le poste ne connaît jamais le jeton en clair. */
export async function badgeTokenHash(token: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  let binary = ''
  for (const byte of new Uint8Array(digest).subarray(0, 16)) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// ---- Résultat d'un contrôle (control-api.md, objet ControlResult) ----

export interface ControlResolveInput {
  /** Inscription trouvée pour le badge lu, avec son édition ; `null` si le jeton est inconnu */
  registration: { editionId: number; editionYear: number } | null
  publishedEditionId: number
  /** Jour contrôlé ; `null` en mode essai */
  dayId: number | null
  /** Entrée déjà connue ce jour pour ce badge */
  alreadyEntered: boolean
}

export interface ControlResolution {
  status: SalmControlStatus
  reason: SalmControlRefusal | null
  otherEditionYear: number | null
}

export function resolveControlResult(input: ControlResolveInput): ControlResolution {
  const { registration } = input
  if (!registration) return { status: 'refused', reason: 'INVALID', otherEditionYear: null }
  if (registration.editionId !== input.publishedEditionId) {
    return { status: 'refused', reason: 'OTHER_EDITION', otherEditionYear: registration.editionYear }
  }
  if (input.dayId === null) return { status: 'valid_trial', reason: null, otherEditionYear: null }
  return { status: input.alreadyEntered ? 'already' : 'entered', reason: null, otherEditionYear: null }
}

// ---- Affichage ----

/** `2027-03-12T09:42:10.000Z` → `09h42` (UTC = Abidjan). */
export function formatEntryTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${String(d.getUTCHours()).padStart(2, '0')}h${String(d.getUTCMinutes()).padStart(2, '0')}`
}
