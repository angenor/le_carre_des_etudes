import { formatBadgeNumber } from '#shared/utils/salm'
import {
  badgeTokenHash,
  controlDayFor,
  extractVerifyToken,
  formatEntryTime,
  parseControlQuery,
  resolveControlResult,
  type ControlQuery,
} from '#shared/utils/salm-control'
import type {
  SalmControlBadge,
  SalmControlCounter,
  SalmControlDay,
  SalmControlKnownEntry,
  SalmControlLookup,
  SalmControlResult,
  SalmControlSnapshot,
  SalmControlState,
  SalmControlSyncItem,
  SalmControlSyncResult,
} from '#shared/types/salm'

// État du poste de contrôle d'entrée SALM (specs/008, R5, R9, R10, R14).
// En ligne d'abord (délai de 3 s), puis repli sur la liste préchargée ; les entrées validées hors ligne
// vont dans une file locale, envoyée au retour du réseau.
// Toutes les données sont chargées dans le navigateur (onMounted ou actions) : le HTML rendu par le
// serveur, que le service worker garde en cache, ne contient aucun nom ni numéro de badge (S2).

const API = '/api/admin/salm/control'
const REQUEST_TIMEOUT_MS = 3000
const BULK_TIMEOUT_MS = 20000
const SAME_READ_IGNORE_MS = 5000
const SNAPSHOT_EVERY_MS = 5 * 60 * 1000
const STATE_EVERY_MS = 15 * 1000
const TICK_EVERY_MS = 30 * 1000
// Précharge « à jour » : rechargée toutes les 5 min, avec une minute de marge pour le temps de chargement
const SNAPSHOT_FRESH_MS = SNAPSHOT_EVERY_MS + 60 * 1000
const CLOCK_SKEW_WARN_MS = 5 * 60 * 1000
const MAX_TIMER_MS = 24 * 60 * 60 * 1000
const SYNC_BATCH = 200

export type ControlTone = 'entered' | 'already' | 'refused' | 'neutral' | 'trial'

export interface ControlDisplayPerson {
  fullName: string
  studyLevel: string
  badgeNumber: string
}

/** Résultat affiché plein écran (contracts/ui-routes.md, écran de résultat). */
export interface ControlDisplay {
  tone: ControlTone
  title: string
  detail: string | null
  person: ControlDisplayPerson | null
  /** Entrée enregistrée sur le serveur, annulable (FR-217) */
  entryId: number | null
  /** Entrée encore dans la file du téléphone, annulable sans réseau (FR-237) */
  queuedClientId: string | null
  action: 'retry' | 'relogin' | null
}

export const CONTROL_TITLES = {
  entered: 'ENTRÉE VALIDÉE',
  already: 'DÉJÀ ENTRÉ·E AUJOURD\'HUI',
  refused: 'BADGE REFUSÉ',
  neutral: 'NON VÉRIFIÉ',
  trial: 'VALIDE (ESSAI)',
} satisfies Record<ControlTone, string>

/** Fiche de la saisie manuelle (FR-218 à FR-221) ou d'un badge ouvert par `?token=` (FR-223). */
export interface ManualCard {
  /** `null` pour une fiche lue dans la liste hors ligne */
  registrationId: number | null
  seq: number
  person: ControlDisplayPerson
  /** Entrée du jour contrôlé : sur le serveur (`id`) ou dans la file du téléphone (`clientId`) */
  entry: { id: number | null; clientId: string | null; enteredAt: string } | null
  /** Aucun jour de salon aujourd'hui */
  trial: boolean
}

export const MANUAL_FORMAT_MESSAGE = 'Saisissez un numéro de badge (ex. 482 ou SALM27-000482) ou un téléphone (ex. 07 12 34 56 78)'
const OFFLINE_PHONE_MESSAGE = 'Recherche par téléphone indisponible hors ligne : utilisez le numéro de badge'
const OFFLINE_ABSENT = 'Badge absent de la liste hors ligne'

type RequestFailure = 'session' | 'network' | 'no-edition' | 'not-found' | 'other'

/** Nature d'un échec de `$fetch` : session expirée, réseau (délai, 5xx), ou autre. */
export function requestFailure(error: unknown): RequestFailure {
  const e = error as { statusCode?: number; response?: { status?: number }; data?: { data?: { code?: string }; code?: string } }
  const status = e?.statusCode ?? e?.response?.status
  if (!status) return 'network'
  if (status === 401) return 'session'
  if (status >= 500) return 'network'
  const code = e?.data?.data?.code ?? e?.data?.code
  if (status === 404 && code === 'NO_PUBLISHED_EDITION') return 'no-edition'
  if (status === 404) return 'not-found'
  return 'other'
}

/** Code d'erreur métier (`data.code`) d'un échec de `$fetch`. */
export function requestErrorCode(error: unknown): string | null {
  const e = error as { data?: { data?: { code?: string }; code?: string } }
  return e?.data?.data?.code ?? e?.data?.code ?? null
}

/** `$fetch` avec un délai maximal (FR-233 : au-delà de 3 s, le serveur est considéré injoignable). */
export async function controlFetch<T>(
  url: string,
  options: Parameters<typeof $fetch>[1] = {},
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await $fetch<T>(url, { ...options, signal: controller.signal } as Parameters<typeof $fetch>[1]) as T
  }
  finally {
    clearTimeout(timer)
  }
}

function newClientId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

function seqOf(badgeNumber: string): number {
  return Number(badgeNumber.split('-').pop())
}

function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false
}

export function useSalmControl() {
  const fb = useControlFeedback()

  const status = ref<'loading' | 'ready' | 'no-edition' | 'error'>('loading')
  const sessionExpired = ref(false)
  const edition = ref<SalmControlSnapshot['edition'] | null>(null)
  const year = computed(() => edition.value?.year ?? null)
  const days = ref<SalmControlDay[]>([])
  const todayDayId = ref<number | null>(null)
  const counters = ref<SalmControlCounter[]>([])
  const knownEntries = shallowRef<SalmControlKnownEntry[]>([])
  const registration = ref<SalmControlSnapshot['registration'] | null>(null)
  const snapshotAt = ref<number | null>(null)
  /** Écart entre l'horloge du serveur et celle du téléphone (ms) */
  const clockOffset = ref(0)

  // Hors ligne (R5 à R7)
  const offline = ref(false)
  const queue = shallowRef<SalmControlSyncItem[]>([])
  const pendingCount = computed(() => queue.value.length)
  const storageOk = ref(true)
  const engineReady = ref(false)
  /** Le service worker contrôle la page et a mis ses fichiers en cache (layout salm-controle) */
  const swReady = useState<boolean>('salm-controle-sw-ready', () => false)
  const now = ref(Date.now())
  const endedMessage = ref<string | null>(null)
  let badgeByHash = new Map<string, SalmControlBadge>()
  let badgeBySeq = new Map<number, SalmControlBadge>()
  const hasList = ref(false)

  const readyOffline = computed(() =>
    swReady.value && engineReady.value && storageOk.value && hasList.value
    && snapshotAt.value !== null && now.value - snapshotAt.value < SNAPSHOT_FRESH_MS)

  const clockSkewMinutes = computed(() =>
    Math.abs(clockOffset.value) > CLOCK_SKEW_WARN_MS ? Math.round(Math.abs(clockOffset.value) / 60000) : 0)

  const result = ref<ControlDisplay | null>(null)
  const busy = ref(false)

  const manual = reactive({
    open: false,
    searching: false,
    card: null as ManualCard | null,
    message: null as string | null,
  })

  const onsite = reactive({
    open: false,
    submitting: false,
    errors: {} as Record<string, string>,
    message: null as string | null,
  })

  const today = computed(() => days.value.find((d) => d.id === todayDayId.value) ?? null)

  let lastRead = { text: '', at: 0 }
  let lastEntryId = 0
  let retry: (() => void) | null = null
  let syncing = false
  let endTimer: ReturnType<typeof setTimeout> | undefined
  const timers: ReturnType<typeof setInterval>[] = []

  // ---- Précharge et rafraîchissement ----

  function applyCounters(next: SalmControlCounter[]) {
    counters.value = next
  }

  /** Entrées reçues de `state` : elles font avancer le curseur `afterId`. */
  function mergeEntries(entries: SalmControlKnownEntry[]) {
    if (!entries.length) return
    const byId = new Map(knownEntries.value.map((e) => [e.id, e]))
    for (const e of entries) byId.set(e.id, e)
    knownEntries.value = [...byId.values()]
    lastEntryId = Math.max(lastEntryId, ...entries.map((e) => e.id))
  }

  /** Entrée validée en ligne par ce poste : connue localement, sans avancer le curseur. */
  function rememberEntry(entry: SalmControlKnownEntry) {
    if (!knownEntries.value.some((e) => e.id === entry.id)) knownEntries.value = [...knownEntries.value, entry]
  }

  function setServerTime(iso: string) {
    const t = Date.parse(iso)
    if (Number.isFinite(t)) clockOffset.value = t - Date.now()
  }

  function serverNow(): Date {
    return new Date(Date.now() + clockOffset.value)
  }

  function onRequestError(error: unknown) {
    const failure = requestFailure(error)
    if (failure === 'session') sessionExpired.value = true
    if (failure === 'no-edition') status.value = 'no-edition'
    if (failure === 'network') offline.value = true
    return failure
  }

  function onRequestOk() {
    offline.value = false
    sessionExpired.value = false
  }

  function applySnapshot(snap: SalmControlSnapshot, fetchedAt: number) {
    edition.value = snap.edition
    days.value = snap.days
    todayDayId.value = snap.todayDayId
    applyCounters(snap.counters)
    knownEntries.value = snap.entries
    lastEntryId = snap.entries.reduce((max, e) => Math.max(max, e.id), 0)
    registration.value = snap.registration
    snapshotAt.value = fetchedAt
    // Heure du serveur au moment du chargement (précharge fraîche ou relue du stockage)
    const serverTime = Date.parse(snap.serverTime)
    if (Number.isFinite(serverTime)) clockOffset.value = serverTime - fetchedAt
    badgeByHash = new Map(snap.badges.map((b) => [b.h, b]))
    badgeBySeq = new Map(snap.badges.map((b) => [b.seq, b]))
    hasList.value = true
    checkDay()
    status.value = 'ready'
    // Minuteur de fin de salon, y compris pour une précharge relue hors ligne (FR-239)
    scheduleEnd(snap.edition.endsAt)
  }

  async function loadSnapshot() {
    if (isOffline()) {
      offline.value = true
      if (status.value === 'loading') status.value = hasList.value ? 'ready' : 'error'
      return
    }
    try {
      const snap = await controlFetch<SalmControlSnapshot>(`${API}/snapshot`, {}, BULK_TIMEOUT_MS)
      const fetchedAt = Date.now()
      applySnapshot(snap, fetchedAt)
      onRequestOk()
      const endsAt = snap.edition.endsAt ? Date.parse(snap.edition.endsAt) : Number.NaN
      // Salon terminé : rien n'est gardé sur le téléphone (FR-239)
      if (Number.isFinite(endsAt) && endsAt <= Date.parse(snap.serverTime)) return
      writeSnapshot({ ...snap, fetchedAt })
      writeSessionMarker({ editionEndsAt: snap.edition.endsAt })
    }
    catch (error) {
      const failure = onRequestError(error)
      if (status.value === 'loading' && failure !== 'no-edition') status.value = hasList.value ? 'ready' : 'error'
    }
  }

  async function refreshState() {
    if (status.value !== 'ready' || isOffline()) return
    try {
      let more = true
      while (more) {
        const state = await controlFetch<SalmControlState>(`${API}/state`, { query: { afterId: lastEntryId } })
        onRequestOk()
        // Jour ajouté ou modifié depuis la précharge : la recharger
        if (state.todayDayId !== null && !days.value.some((d) => d.id === state.todayDayId)) {
          await loadSnapshot()
          return
        }
        todayDayId.value = state.todayDayId
        applyCounters(state.counters)
        mergeEntries(state.entries)
        setServerTime(state.serverTime)
        more = state.hasMore && state.entries.length > 0
      }
    }
    catch (error) {
      onRequestError(error)
    }
  }

  /** Changement de date à minuit : le jour contrôlé est recalculé à partir de l'heure du serveur (R9). */
  function checkDay() {
    if (!days.value.length) return
    todayDayId.value = controlDayFor(days.value, serverNow())?.id ?? null
  }

  // ---- File hors ligne et synchronisation (FR-234 à FR-237) ----

  function setQueue(next: SalmControlSyncItem[]): boolean {
    if (!writeQueue(next)) return false
    queue.value = next
    return true
  }

  /** Envoie la file par lots ; les éléments traités en sortent, quel que soit leur statut. */
  async function syncQueue() {
    if (syncing || isOffline() || !readQueue().length) return
    syncing = true
    let sent = false
    try {
      let pending = readQueue()
      while (pending.length) {
        const res = await controlFetch<SalmControlSyncResult>(
          `${API}/sync`,
          { method: 'POST', body: { entries: pending.slice(0, SYNC_BATCH) } },
          BULK_TIMEOUT_MS,
        )
        onRequestOk()
        const done = new Set(res.results.map((r) => r.clientId))
        // Relire la file : des entrées ont pu y être ajoutées pendant l'envoi
        pending = readQueue().filter((item) => !done.has(item.clientId))
        setQueue(pending)
        applyCounters(res.counters)
        sent = true
        if (!done.size) break
      }
    }
    catch (error) {
      // En cas d'erreur, la file reste intacte
      onRequestError(error)
    }
    finally {
      syncing = false
    }
    if (sent) await refreshState()
  }

  /** Entrée du jour connue du poste pour ce badge : dans la file, ou reçue du serveur. */
  function localEntry(badge: SalmControlBadge, dayId: number) {
    const queued = queue.value.find((i) => i.seq === badge.seq && i.dayId === dayId)
    if (queued) return { id: null, clientId: queued.clientId, enteredAt: queued.scannedAt }
    const known = badge.h ? knownEntries.value.find((e) => e.h === badge.h && e.dayId === dayId) : undefined
    return known ? { id: known.id, clientId: null, enteredAt: known.at } : null
  }

  function personOf(badge: SalmControlBadge): ControlDisplayPerson {
    return { fullName: badge.name, studyLevel: badge.level, badgeNumber: formatBadgeNumber(year.value ?? 0, badge.seq) }
  }

  /** Même règle que le serveur (`resolveControlResult`), sur la liste préchargée ; l'entrée va dans la file. */
  function validateLocally(badge: SalmControlBadge, mode: 'scan' | 'manual') {
    checkDay()
    const dayId = todayDayId.value
    const known = dayId !== null ? localEntry(badge, dayId) : null
    const ed = edition.value!
    const resolution = resolveControlResult({
      registration: { editionId: ed.id, editionYear: ed.year },
      publishedEditionId: ed.id,
      dayId,
      alreadyEntered: !!known,
    })
    const person = personOf(badge)
    const base = { person, entryId: null, queuedClientId: null, action: null }
    if (resolution.status === 'valid_trial' || dayId === null) {
      display({ ...base, tone: 'trial', title: CONTROL_TITLES.trial, detail: 'Mode essai : aucune entrée n\'est enregistrée' })
      return
    }
    if (known) {
      display({ ...base, tone: 'already', title: CONTROL_TITLES.already, detail: `à ${formatEntryTime(known.enteredAt)}` })
      return
    }
    const item: SalmControlSyncItem = { clientId: newClientId(), seq: badge.seq, dayId, scannedAt: new Date().toISOString(), mode }
    // Écriture synchrone AVANT l'affichage vert (SC-005) ; jamais le jeton (S1)
    if (!setQueue([...readQueue(), item])) {
      display({ ...base, person: null, tone: 'neutral', title: CONTROL_TITLES.neutral, detail: 'Entrée non enregistrée : stockage du téléphone indisponible' })
      return
    }
    display({ ...base, tone: 'entered', title: CONTROL_TITLES.entered, detail: `à ${formatEntryTime(item.scannedAt)}`, queuedClientId: item.clientId })
  }

  async function scanLocally(token: string) {
    if (!hasList.value || !edition.value) {
      retry = () => sendToken(token)
      display(neutral('Réseau indisponible', 'retry'))
      return
    }
    const badge = badgeByHash.get(await badgeTokenHash(token))
    if (!badge) {
      display(neutral(OFFLINE_ABSENT))
      return
    }
    validateLocally(badge, 'scan')
  }

  // ---- Résultats ----

  function display(next: ControlDisplay) {
    result.value = next
    fb.feedback(next.tone === 'trial' ? 'entered' : next.tone)
  }

  function toDisplay(res: SalmControlResult): ControlDisplay {
    const person = res.person
      ? { fullName: res.person.fullName, studyLevel: res.person.studyLevel, badgeNumber: res.person.badgeNumber }
      : null
    const at = res.entry ? `à ${formatEntryTime(res.entry.enteredAt)}` : null
    const base = { person, entryId: null, queuedClientId: null, action: null }
    switch (res.status) {
      case 'entered':
        return { ...base, tone: 'entered', title: CONTROL_TITLES.entered, detail: at, entryId: res.entry?.id ?? null }
      case 'already':
        return { ...base, tone: 'already', title: CONTROL_TITLES.already, detail: at }
      case 'valid_trial':
        return { ...base, tone: 'trial', title: CONTROL_TITLES.trial, detail: 'Mode essai : aucune entrée n\'est enregistrée' }
      default:
        return {
          ...base,
          person: null,
          tone: 'refused',
          title: CONTROL_TITLES.refused,
          detail: res.reason === 'OTHER_EDITION' ? `Badge d'une autre édition (SALM ${res.otherEditionYear})` : 'Badge invalide',
        }
    }
  }

  function neutral(detail: string, action: ControlDisplay['action'] = null): ControlDisplay {
    return { tone: 'neutral', title: CONTROL_TITLES.neutral, detail, person: null, entryId: null, queuedClientId: null, action }
  }

  function failureDisplay(error: unknown, retryWith: () => void): ControlDisplay {
    const failure = onRequestError(error)
    if (failure === 'session') return neutral('Session expirée', 'relogin')
    retry = retryWith
    if (failure === 'network') return neutral('Réseau indisponible', 'retry')
    return neutral('Erreur inattendue', 'retry')
  }

  function applyResult(res: SalmControlResult) {
    applyCounters(res.counters)
    display(toDisplay(res))
  }

  async function sendToken(token: string) {
    busy.value = true
    try {
      // Sans réseau : repli immédiat sur la liste préchargée (FR-233)
      if (isOffline()) {
        offline.value = true
        await scanLocally(token)
        return
      }
      const res = await controlFetch<SalmControlResult>(`${API}/entries`, { method: 'POST', body: { token } })
      onRequestOk()
      applyResult(res)
      if (res.entry && res.day) {
        rememberEntry({ id: res.entry.id, h: await badgeTokenHash(token), dayId: res.day.id, at: res.entry.enteredAt })
      }
    }
    catch (error) {
      // Délai de 3 s dépassé, réseau ou 5xx : même contrôle sur la liste préchargée
      if (onRequestError(error) === 'network') await scanLocally(token)
      else display(failureDisplay(error, () => sendToken(token)))
    }
    finally {
      busy.value = false
      lastRead.at = Date.now()
    }
  }

  /** Lecture d'un QR code par la caméra (FR-205 à FR-210). */
  async function onRead(text: string) {
    if (busy.value) return
    const t = Date.now()
    // Même QR code dans les 5 s qui suivent son résultat : ignoré (R10)
    if (text === lastRead.text && t - lastRead.at < SAME_READ_IGNORE_MS) return
    lastRead = { text, at: t }
    retry = null
    const token = extractVerifyToken(text)
    if (!token) {
      display({ ...neutral('Ce QR code n\'est pas un badge SALM'), tone: 'refused', title: CONTROL_TITLES.refused })
      return
    }
    await sendToken(token)
  }

  function retryLast() {
    const run = retry
    retry = null
    result.value = null
    run?.()
  }

  function closeResult() {
    result.value = null
  }

  function afterCancel() {
    result.value = null
    // Le même badge peut être rescanné aussitôt
    lastRead = { text: '', at: 0 }
  }

  /** Retire de la file une entrée validée hors ligne, sans réseau (FR-237). */
  function cancelQueued(clientId: string): boolean {
    if (!readQueue().some((i) => i.clientId === clientId)) {
      alert('Cette entrée vient d\'être envoyée : annulez-la depuis la saisie manuelle.')
      return false
    }
    if (!confirm('Annuler cette entrée ? Le badge pourra être scanné de nouveau.')) return false
    setQueue(readQueue().filter((i) => i.clientId !== clientId))
    afterCancel()
    return true
  }

  /** Annule une entrée enregistrée sur le serveur, après confirmation (FR-217) ; exige le réseau. */
  async function cancelEntry(entryId: number): Promise<boolean> {
    if (!confirm('Annuler cette entrée ? Le badge pourra être scanné de nouveau.')) return false
    busy.value = true
    try {
      const { counters: next } = await controlFetch<{ counters: SalmControlCounter[] }>(`${API}/entries/${entryId}`, { method: 'DELETE' })
      onRequestOk()
      applyCounters(next)
      knownEntries.value = knownEntries.value.filter((e) => e.id !== entryId)
      afterCancel()
      return true
    }
    catch (error) {
      const failure = onRequestError(error)
      const code = requestErrorCode(error)
      alert(
        failure === 'session' ? 'Session expirée : reconnectez-vous pour annuler cette entrée.'
          : code === 'NOT_TODAY' ? 'Seules les entrées du jour peuvent être annulées.'
            : failure === 'not-found' ? 'Cette entrée a déjà été annulée.'
              : 'Annulation impossible sans réseau. Réessayez au retour du réseau.',
      )
      return false
    }
    finally {
      busy.value = false
    }
  }

  /** « Annuler cette entrée » sur l'écran de résultat. */
  async function cancelResult() {
    const r = result.value
    if (r?.queuedClientId) cancelQueued(r.queuedClientId)
    else if (r?.entryId) await cancelEntry(r.entryId)
  }

  /** « Annuler cette entrée » sur la fiche de la saisie manuelle. */
  async function cancelCard() {
    const card = manual.card
    const entry = card?.entry
    if (!card || !entry) return
    const done = entry.clientId ? cancelQueued(entry.clientId) : entry.id ? await cancelEntry(entry.id) : false
    if (done && manual.card === card) manual.card = { ...card, entry: null }
  }

  // ---- Saisie manuelle (US2) ----

  function openManual(message: string | null = null) {
    onsite.open = false
    manual.open = true
    manual.card = null
    manual.message = message
  }

  function closeManual() {
    manual.open = false
    manual.card = null
    manual.message = null
  }

  function notFoundMessage() {
    return `Aucun inscrit avec ce numéro pour le SALM ${year.value ?? ''}`.trim()
  }

  /** Fiche ou message à partir d'une réponse de `GET /control/lookup`. */
  function showLookup(res: SalmControlLookup) {
    manual.card = null
    manual.message = null
    if (res.validity === 'other_edition') {
      manual.message = `Badge d'une autre édition (SALM ${res.otherEditionYear})`
      return
    }
    if (!res.found || !res.person) {
      manual.message = res.validity === 'invalid' ? 'Badge invalide' : notFoundMessage()
      return
    }
    const entry = res.today?.entry
    manual.card = {
      registrationId: res.person.registrationId,
      seq: seqOf(res.person.badgeNumber),
      person: { fullName: res.person.fullName, studyLevel: res.person.studyLevel, badgeNumber: res.person.badgeNumber },
      entry: entry ? { id: entry.id, clientId: null, enteredAt: entry.enteredAt } : null,
      trial: !res.today?.day,
    }
  }

  /** Fiche lue dans la liste préchargée (FR-237, US2-6a). */
  function showLocalBadge(badge: SalmControlBadge | undefined) {
    manual.card = null
    manual.message = null
    if (!hasList.value) {
      manual.message = 'Réseau indisponible : réessayez.'
      return
    }
    if (!badge) {
      manual.message = OFFLINE_ABSENT
      return
    }
    checkDay()
    const dayId = todayDayId.value
    manual.card = {
      registrationId: null,
      seq: badge.seq,
      person: personOf(badge),
      entry: dayId !== null ? localEntry(badge, dayId) : null,
      trial: dayId === null,
    }
  }

  function searchLocally(parsed: ControlQuery | null) {
    if (parsed?.kind === 'phone') {
      manual.card = null
      manual.message = OFFLINE_PHONE_MESSAGE
      return
    }
    if (parsed) showLocalBadge(badgeBySeq.get(parsed.seq))
  }

  function lookupFailure(error: unknown): string {
    const failure = onRequestError(error)
    if (failure === 'session') return 'Session expirée : reconnectez-vous.'
    if (requestErrorCode(error) === 'INVALID_QUERY') return MANUAL_FORMAT_MESSAGE
    if (failure === 'network') return 'Réseau indisponible : réessayez.'
    return 'Recherche impossible : réessayez.'
  }

  /** Recherche en ligne ; sur échec réseau, `fallback` cherche dans la liste préchargée. */
  async function runLookup(query: Record<string, string>, fallback: () => void | Promise<void>) {
    manual.searching = true
    manual.message = null
    try {
      if (isOffline()) {
        offline.value = true
        await fallback()
        return
      }
      showLookup(await controlFetch<SalmControlLookup>(`${API}/lookup`, { query }))
      onRequestOk()
    }
    catch (error) {
      if (requestFailure(error) === 'network') {
        onRequestError(error)
        await fallback()
      }
      else {
        manual.card = null
        manual.message = lookupFailure(error)
      }
    }
    finally {
      manual.searching = false
    }
  }

  /** Recherche par numéro de badge ou téléphone ; rien n'est enregistré. */
  async function searchManual(q: string) {
    const parsed = year.value ? parseControlQuery(q, year.value) : null
    if (year.value && !parsed) {
      manual.card = null
      manual.message = MANUAL_FORMAT_MESSAGE
      return
    }
    await runLookup({ q }, () => searchLocally(parsed))
  }

  /** Fiche d'un badge ouvert depuis `/salm/v/:token` (« Contrôler ce badge »), sans enregistrer (FR-223). */
  async function openToken(token: string) {
    openManual()
    await runLookup({ token }, async () => showLocalBadge(badgeByHash.get(await badgeTokenHash(token))))
  }

  /** Entrée validée hors ligne depuis une fiche (file du téléphone). */
  function validateCardLocally(card: ManualCard) {
    const badge = badgeBySeq.get(card.seq) ?? { h: '', seq: card.seq, name: card.person.fullName, level: card.person.studyLevel }
    closeManual()
    validateLocally(badge, 'manual')
  }

  /** « Valider l'entrée » depuis une fiche : même résultat qu'un scan (FR-220). */
  async function validateManual(card: ManualCard) {
    if (card.registrationId === null || isOffline() || !edition.value) {
      if (edition.value) validateCardLocally(card)
      return
    }
    busy.value = true
    try {
      const res = await controlFetch<SalmControlResult>(`${API}/entries`, { method: 'POST', body: { registrationId: card.registrationId } })
      onRequestOk()
      closeManual()
      applyResult(res)
    }
    catch (error) {
      const failure = requestFailure(error)
      if (failure === 'not-found') {
        manual.card = null
        manual.message = notFoundMessage()
      }
      else if (failure === 'network') {
        onRequestError(error)
        validateCardLocally(card)
      }
      else {
        closeManual()
        display(failureDisplay(error, () => validateManual(card)))
      }
    }
    finally {
      busy.value = false
    }
  }

  // ---- Accueil des non-inscrit·e·s (US4) ----

  function openOnsite() {
    closeManual()
    onsite.open = true
    onsite.errors = {}
    onsite.message = null
  }

  function closeOnsite() {
    onsite.open = false
  }

  /** Inscription par l'équipe, puis entrée du jour (FR-242 à FR-246). */
  async function registerOnsite(fields: { fullName: string; phone: string; studyLevel: string; informed: boolean }) {
    if (isOffline()) {
      onsite.message = 'Inscription sur place indisponible hors ligne : réessayez au retour du réseau'
      return
    }
    onsite.submitting = true
    onsite.errors = {}
    onsite.message = null
    try {
      const res = await controlFetch<SalmControlResult | { created: false; lookup: SalmControlLookup }>(
        `${API}/registrations`,
        { method: 'POST', body: fields },
        BULK_TIMEOUT_MS,
      )
      onRequestOk()
      closeOnsite()
      if ('lookup' in res) {
        // Téléphone déjà inscrit : fiche existante, rien n'est créé (FR-245)
        openManual()
        showLookup(res.lookup)
        return
      }
      applyCounters(res.counters)
      const person = res.person!
      if (res.entryError) {
        // Inscription créée, entrée à valider depuis la fiche
        openManual('Inscription enregistrée, mais l\'entrée n\'a pas pu l\'être : validez-la ci-dessous.')
        manual.card = { registrationId: person.registrationId, seq: seqOf(person.badgeNumber), person, entry: null, trial: false }
        return
      }
      display({
        ...toDisplay(res),
        detail: `Communiquez le numéro ${person.badgeNumber} à la personne. Son badge se récupère sur /salm avec son nom et son téléphone.`,
      })
    }
    catch (error) {
      const failure = requestFailure(error)
      const data = (error as { data?: { data?: { errors?: Record<string, string> } } }).data?.data
      if (requestErrorCode(error) === 'VALIDATION' && data?.errors) onsite.errors = data.errors
      else if (requestErrorCode(error) === 'NOT_A_SALON_DAY') onsite.message = 'Aucun jour de salon aujourd\'hui : inscription sur place indisponible.'
      else if (failure === 'session') {
        onRequestError(error)
        onsite.message = 'Session expirée : reconnectez-vous.'
      }
      else if (failure === 'network') {
        onRequestError(error)
        onsite.message = 'Inscription sur place indisponible hors ligne : réessayez au retour du réseau'
      }
      else onsite.message = 'Inscription impossible : réessayez.'
    }
    finally {
      onsite.submitting = false
    }
  }

  // ---- Fin du salon : effacement des données du poste (FR-239) ----

  function scheduleEnd(endsAt: string | null) {
    clearTimeout(endTimer)
    const end = endsAt ? Date.parse(endsAt) : Number.NaN
    if (!Number.isFinite(end)) return
    const delay = end - serverNow().getTime()
    if (delay <= 0) return
    endTimer = setTimeout(() => {
      if (end - serverNow().getTime() > 0) scheduleEnd(endsAt)
      else finishSalon()
    }, Math.min(delay, MAX_TIMER_MS))
  }

  function forgetLocalList() {
    badgeByHash = new Map()
    badgeBySeq = new Map()
    hasList.value = false
    knownEntries.value = []
    queue.value = []
  }

  /** Dernière synchronisation si possible, puis effacement du stockage et des caches. */
  async function finishSalon() {
    await syncQueue()
    await clearControlData()
    forgetLocalList()
    swReady.value = false
    endedMessage.value = `Le SALM ${year.value ?? ''} est terminé : les données de contrôle ont été effacées de ce téléphone`
  }

  // ---- Cycle de vie ----

  function onOnline() {
    offline.value = false
    syncQueue()
    if (!snapshotAt.value || Date.now() - snapshotAt.value >= SNAPSHOT_EVERY_MS) loadSnapshot()
    else refreshState()
  }

  function onOffline() {
    offline.value = true
  }

  onMounted(async () => {
    storageOk.value = isStorageAvailable()
    // Avant tout affichage : salon terminé depuis la dernière visite → effacement (FR-239)
    if (isControlDataExpired()) {
      queue.value = readQueue()
      await syncQueue()
      await clearControlData()
    }
    queue.value = readQueue()
    offline.value = isOffline()

    // Démarrage immédiat sur la précharge gardée, puis mise à jour par le réseau
    const stored = readSnapshot()
    if (stored?.edition && Array.isArray(stored.badges)) applySnapshot(stored, stored.fetchedAt)
    preloadQrEngine().then(() => { engineReady.value = true }).catch(() => {})
    await loadSnapshot()
    syncQueue()

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    timers.push(
      setInterval(loadSnapshot, SNAPSHOT_EVERY_MS),
      setInterval(() => {
        refreshState()
        if (queue.value.length) syncQueue()
      }, STATE_EVERY_MS),
      setInterval(() => {
        now.value = Date.now()
        checkDay()
      }, TICK_EVERY_MS),
    )
  })

  onBeforeUnmount(() => {
    timers.forEach(clearInterval)
    clearTimeout(endTimer)
    window.removeEventListener('online', onOnline)
    window.removeEventListener('offline', onOffline)
  })

  return {
    feedback: fb,
    status,
    sessionExpired,
    year,
    days,
    today,
    todayDayId,
    counters,
    registration,
    snapshotAt,
    clockOffset,
    clockSkewMinutes,
    offline,
    pendingCount,
    readyOffline,
    storageOk,
    endedMessage,
    result,
    busy,
    onRead,
    retryLast,
    closeResult,
    cancelResult,
    cancelCard,
    manual,
    onsite,
    openOnsite,
    closeOnsite,
    registerOnsite,
    openManual,
    closeManual,
    searchManual,
    openToken,
    validateManual,
    showLookup,
    display,
    toDisplay,
    applyResult,
    neutral,
    failureDisplay,
    loadSnapshot,
    syncQueue,
    onRequestError,
  }
}
