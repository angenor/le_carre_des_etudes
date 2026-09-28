import { createError, getRequestHeader, setResponseHeader, type H3Event } from 'h3'

// Limitation de débit en mémoire, par fenêtre fixe (research R11).
// Le conteneur est unique et mono-processus : aucun stockage partagé n'est nécessaire.
// Les compteurs sont perdus au redémarrage, et rien n'est jamais persisté (ni IP ni téléphone).

export interface RateLimit {
  max: number
  windowMs: number
}

const MINUTE = 60 * 1000

// Inscriptions et récupérations étudiantes, par IP. Seuil large : CGNAT des opérateurs mobiles, Wi-Fi partagés.
export const STUDENT_LIMIT: RateLimit = { max: 30, windowMs: 10 * MINUTE }
// Échecs « nom différent », par téléphone : empêche de deviner un nom par essais successifs.
export const NAME_MISMATCH_LIMIT: RateLimit = { max: 5, windowMs: 60 * MINUTE }
// Inscriptions établissements, par IP.
export const SCHOOL_LIMIT: RateLimit = { max: 5, windowMs: 10 * MINUTE }

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()
let lastSweep = 0

function sweep(now: number) {
  if (now - lastSweep < MINUTE) return
  lastSweep = now
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

function currentBucket(key: string, windowMs: number, now: number): Bucket {
  sweep(now)
  let bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs }
    buckets.set(key, bucket)
  }
  return bucket
}

function rateLimited(event: H3Event | undefined, bucket: Bucket, now: number): never {
  const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
  if (event) setResponseHeader(event, 'Retry-After', retryAfter)
  throw createError({ statusCode: 429, message: 'RATE_LIMITED', data: { code: 'RATE_LIMITED' } })
}

/**
 * Adresse du client : en-tête `x-real-ip` posé par nginx (`$remote_addr`), sinon adresse du socket.
 * `x-forwarded-for` n'est jamais lu : son premier élément est fourni par le client.
 */
export function getClientIp(event: H3Event): string {
  return getRequestHeader(event, 'x-real-ip')?.trim() || event.node.req.socket?.remoteAddress || 'unknown'
}

/** Compte une requête pour `key` ; au-delà de `max` dans la fenêtre, lève `429 RATE_LIMITED`. */
export function assertRateLimit(key: string, limit: RateLimit, event?: H3Event) {
  const now = Date.now()
  const bucket = currentBucket(key, limit.windowMs, now)
  if (bucket.count >= limit.max) rateLimited(event, bucket, now)
  bucket.count++
}

/** Vérifie, sans compter, que `key` n'a pas atteint sa limite d'échecs. */
export function assertBelowFailureLimit(key: string, limit: RateLimit, event?: H3Event) {
  const now = Date.now()
  const bucket = buckets.get(key)
  if (bucket && bucket.resetAt > now && bucket.count >= limit.max) rateLimited(event, bucket, now)
}

/** Enregistre un échec (ex. `NAME_MISMATCH`) ; renvoie `true` si la limite est désormais atteinte. */
export function recordFailure(key: string, limit: RateLimit): boolean {
  const bucket = currentBucket(key, limit.windowMs, Date.now())
  bucket.count++
  return bucket.count > limit.max
}
