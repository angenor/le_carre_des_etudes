import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { prisma } from '../../../../../../utils/prisma'
import { parseIdParam } from '../../../../../../utils/salm-admin'
import { asBody, assertValid, found, nextSortOrder, validateSlot } from '../../../../../../utils/salm-content'

// Ajout d'un créneau, en fin de jour ; les chevauchements ne sont jamais une erreur (FR-152, FR-153).
export default defineEventHandler(async (event) => {
  const dayId = parseIdParam(event, 'id')
  found(await prisma.salmDay.findUnique({ where: { id: dayId }, select: { id: true } }))
  const { data, errors } = validateSlot(asBody(await readBody(event).catch(() => null)))
  assertValid(errors)
  const slot = await prisma.salmSlot.create({
    data: {
      dayId,
      startTime: data.startTime!,
      endTime: data.endTime!,
      title: data.title!,
      kind: data.kind!,
      description: data.description ?? null,
      isHighlighted: data.isHighlighted ?? false,
      sortOrder: await nextSortOrder('salmSlot', { dayId }),
    },
    select: { id: true, startTime: true, endTime: true, title: true, kind: true, description: true, isHighlighted: true },
  })
  setResponseStatus(event, 201)
  return slot
})
