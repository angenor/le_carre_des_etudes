import { defineEventHandler, readBody } from 'h3'
import { prisma } from '../../../../utils/prisma'
import { parseIdParam } from '../../../../utils/salm-admin'
import { asBody, assertValid, found, validateSlot } from '../../../../utils/salm-content'

// Modification d'un créneau ; fin postérieure au début sur les valeurs fusionnées (FR-152).
export default defineEventHandler(async (event) => {
  const id = parseIdParam(event, 'id')
  const current = found(await prisma.salmSlot.findUnique({ where: { id }, select: { startTime: true, endTime: true } }))
  const { data, errors } = validateSlot(asBody(await readBody(event).catch(() => null)), { partial: true, current })
  assertValid(errors)
  return prisma.salmSlot.update({
    where: { id },
    data,
    select: { id: true, startTime: true, endTime: true, title: true, kind: true, description: true, isHighlighted: true },
  })
})
