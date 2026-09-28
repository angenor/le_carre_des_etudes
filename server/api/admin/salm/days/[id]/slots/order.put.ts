import { defineEventHandler, readBody } from 'h3'
import { prisma } from '../../../../../../utils/prisma'
import { parseIdParam } from '../../../../../../utils/salm-admin'
import { applyOrder, asBody, found } from '../../../../../../utils/salm-content'

// Ordre des créneaux d'un jour, y compris « Trier par heure » calculé par l'interface (FR-130, FR-154).
export default defineEventHandler(async (event) => {
  const dayId = parseIdParam(event, 'id')
  found(await prisma.salmDay.findUnique({ where: { id: dayId }, select: { id: true } }))
  const body = asBody(await readBody(event).catch(() => null))
  return { ids: await applyOrder('salmSlot', { dayId }, body.ids) }
})
