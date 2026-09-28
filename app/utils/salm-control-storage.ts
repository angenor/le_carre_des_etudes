import type { SalmControlSnapshot, SalmControlSyncItem } from '#shared/types/salm'

// Stockage local du poste de contrôle SALM (specs/008, R7) : clés `salm-controle:v1:*`.
// Chaque accès est protégé : navigation privée, stockage plein ou désactivé.
// Données : précharge (nom, niveau, empreinte du jeton), file d'entrées hors ligne (numéro de badge),
// marqueur de session, préférences. Jamais de téléphone ni de jeton en clair.

const PREFIX = 'salm-controle:v1:'
const KEYS = ['snapshot', 'queue', 'session', 'prefs'] as const
export const CONTROL_CACHE_PREFIX = 'salm-controle-'

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? (JSON.parse(raw) as T) : null
  }
  catch {
    return null
  }
}

function writeJson(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
    return true
  }
  catch {
    return false
  }
}

/** Le stockage local est utilisable (sinon : « Mode hors ligne indisponible sur ce navigateur »). */
export function isStorageAvailable(): boolean {
  try {
    const key = `${PREFIX}probe`
    localStorage.setItem(key, '1')
    localStorage.removeItem(key)
    return true
  }
  catch {
    return false
  }
}

// ---- Précharge ----

export type StoredSnapshot = SalmControlSnapshot & { fetchedAt: number }

export function readSnapshot(): StoredSnapshot | null {
  return readJson<StoredSnapshot>('snapshot')
}

export function writeSnapshot(snapshot: StoredSnapshot): boolean {
  return writeJson('snapshot', snapshot)
}

// ---- File des entrées hors ligne ----

export function readQueue(): SalmControlSyncItem[] {
  const queue = readJson<SalmControlSyncItem[]>('queue')
  return Array.isArray(queue) ? queue : []
}

/** Écriture synchrone : faite avant d'afficher « Entrée validée » hors ligne (SC-005). */
export function writeQueue(queue: SalmControlSyncItem[]): boolean {
  if (queue.length) return writeJson('queue', queue)
  try {
    localStorage.removeItem(`${PREFIX}queue`)
    return true
  }
  catch {
    return false
  }
}

// ---- Marqueur de session (R8) et fin du salon (FR-239) ----

export interface SessionMarker {
  /** Dernière vérification de session réussie (ms) */
  checkedAt: number | null
  /** Fin du dernier jour de salon (ISO), après laquelle les données du poste sont effacées */
  editionEndsAt: string | null
}

export function readSessionMarker(): SessionMarker | null {
  return readJson<SessionMarker>('session')
}

export function writeSessionMarker(marker: Partial<SessionMarker>): void {
  writeJson('session', { checkedAt: null, editionEndsAt: null, ...readSessionMarker(), ...marker })
}

/** La fin du salon mémorisée sur ce téléphone est dépassée. */
export function isControlDataExpired(now = Date.now()): boolean {
  const endsAt = readSessionMarker()?.editionEndsAt ?? readSnapshot()?.edition.endsAt ?? null
  const t = endsAt ? Date.parse(endsAt) : Number.NaN
  return Number.isFinite(t) && now >= t
}

// ---- Préférences ----

export interface SalmControlPrefs {
  sound: boolean
}

export function readControlPrefs(): SalmControlPrefs {
  return { sound: true, ...readJson<Partial<SalmControlPrefs>>('prefs') }
}

export function writeControlPrefs(prefs: SalmControlPrefs): void {
  writeJson('prefs', prefs)
}

// ---- Effacement (déconnexion, fin du salon) ----

/** Efface les clés `salm-controle:v1:*` et les caches `salm-controle-*` du service worker. */
export async function clearControlData(): Promise<void> {
  for (const key of KEYS) {
    try {
      localStorage.removeItem(PREFIX + key)
    }
    catch {
      // stockage indisponible : rien à effacer
    }
  }
  try {
    const names = await caches.keys()
    await Promise.all(names.filter((n) => n.startsWith(CONTROL_CACHE_PREFIX)).map((n) => caches.delete(n)))
  }
  catch {
    // Cache Storage absent (contexte non sécurisé)
  }
  navigator.serviceWorker?.controller?.postMessage({ type: 'clear' })
}
