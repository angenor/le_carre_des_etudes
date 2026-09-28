import { defineEventHandler, readBody, setResponseHeader } from 'h3'
import { adminError } from '../../../../utils/salm-admin'
import { getControlContext, getDayCounters, mergeOfflineEntry, type OfflineMergeResult } from '../../../../utils/salm-control'
import type { SalmControlSyncItem, SalmControlSyncResult } from '#shared/types/salm'

const MAX_ITEMS = 200

/** Élément de la file en liste blanche (tout autre champ, dont un éventuel `token`, est ignoré), sinon `null`. */
function pickItem(raw: unknown): SalmControlSyncItem | null {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const { clientId, seq, dayId, scannedAt, mode } = r
  if (typeof clientId !== 'string' || clientId.length < 1 || clientId.length > 64) return null
  if (typeof seq !== 'number' || !Number.isSafeInteger(seq) || seq < 1) return null
  if (typeof dayId !== 'number' || !Number.isSafeInteger(dayId)) return null
  if (typeof scannedAt !== 'string' || Number.isNaN(Date.parse(scannedAt))) return null
  if (mode !== 'scan' && mode !== 'manual') return null
  return { clientId, seq, dayId, scannedAt, mode }
}

// Envoi des entrées enregistrées hors ligne par un poste (FR-234, FR-235) : un statut par élément.
export default defineEventHandler(async (event): Promise<SalmControlSyncResult> => {
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  const body = await readBody(event).catch(() => null) as { entries?: unknown } | null
  const entries = body?.entries
  if (!Array.isArray(entries) || entries.length < 1 || entries.length > MAX_ITEMS) throw adminError(400, 'VALIDATION')

  const ctx = await getControlContext()
  const results: OfflineMergeResult[] = []
  // Un par un : la contrainte unique et la mise à jour conditionnelle départagent les postes
  for (const raw of entries) {
    const item = pickItem(raw)
    if (!item) {
      const clientId = (raw as { clientId?: unknown })?.clientId
      results.push({ clientId: typeof clientId === 'string' ? clientId.slice(0, 64) : '', status: 'ignored', reason: 'INVALID_ITEM' })
      continue
    }
    results.push(await mergeOfflineEntry(item, ctx))
  }
  return { results, counters: await getDayCounters(ctx.days) }
})
