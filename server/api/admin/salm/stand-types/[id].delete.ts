import { createError, defineEventHandler } from 'h3'
import { prisma } from '../../../../utils/prisma'
import { parseIdParam } from '../../../../utils/salm-admin'
import { found } from '../../../../utils/salm-content'

// Suppression d'un type de stand jamais choisi ; sinon il peut seulement être masqué (FR-172).
export default defineEventHandler(async (event) => {
  const id = parseIdParam(event, 'id')
  const stand = found(await prisma.salmStandType.findUnique({
    where: { id },
    select: { _count: { select: { schoolRegistrations: true } } },
  }))
  const count = stand._count.schoolRegistrations
  if (count > 0) {
    throw createError({ statusCode: 409, message: 'STAND_TYPE_IN_USE', data: { code: 'STAND_TYPE_IN_USE', count } })
  }
  await prisma.salmStandType.delete({ where: { id } })
  return { success: true }
})
