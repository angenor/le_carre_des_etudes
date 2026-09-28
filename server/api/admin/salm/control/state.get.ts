import { defineEventHandler, getQuery, setResponseHeader } from 'h3'
import { getControlContext, getDayCounters, knownEntries } from '../../../../utils/salm-control'
import type { SalmControlState } from '#shared/types/salm'

const MAX_ENTRIES = 500

// Rafraîchissement entre postes (FR-224, FR-236) : compteurs et entrées d'`id > afterId`.
export default defineEventHandler(async (event): Promise<SalmControlState> => {
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  const raw = Number(getQuery(event).afterId)
  const afterId = Number.isSafeInteger(raw) && raw >= 0 ? raw : 0
  const ctx = await getControlContext()
  const [entries, counters] = await Promise.all([
    knownEntries(ctx.days, { afterId, take: MAX_ENTRIES + 1 }),
    getDayCounters(ctx.days),
  ])
  return {
    serverTime: ctx.now.toISOString(),
    todayDayId: ctx.day?.id ?? null,
    counters,
    entries: entries.slice(0, MAX_ENTRIES),
    hasMore: entries.length > MAX_ENTRIES,
  }
})
