import { defineEventHandler, setResponseHeader } from 'h3'
import { prisma } from '../../../../../utils/prisma'
import { adminError, parseIdParam } from '../../../../../utils/salm-admin'
import { getControlContext, getDayCounters } from '../../../../../utils/salm-control'
import { todayIso } from '#shared/utils/salm-control'
import type { SalmControlCounter } from '#shared/types/salm'

// Annulation d'une entrée du jour contrôlé (FR-217) : la ligne est supprimée, sans historique.
export default defineEventHandler(async (event): Promise<{ counters: SalmControlCounter[] }> => {
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  const id = parseIdParam(event, 'id')
  const entry = await prisma.salmEntry.findUnique({ where: { id }, select: { day: { select: { date: true } } } })
  if (!entry) throw adminError(404, 'NOT_FOUND')
  if (entry.day.date !== todayIso()) throw adminError(409, 'NOT_TODAY')
  // Deux annulations simultanées : la seconde ne trouve plus rien
  const { count } = await prisma.salmEntry.deleteMany({ where: { id } })
  if (!count) throw adminError(404, 'NOT_FOUND')
  const ctx = await getControlContext()
  return { counters: await getDayCounters(ctx.days) }
})
