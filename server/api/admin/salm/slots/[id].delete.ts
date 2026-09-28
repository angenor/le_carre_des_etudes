import { defineEventHandler } from 'h3'
import { prisma } from '../../../../utils/prisma'
import { parseIdParam } from '../../../../utils/salm-admin'
import { found } from '../../../../utils/salm-content'

// Suppression d'un créneau (FR-152).
export default defineEventHandler(async (event) => {
  const id = parseIdParam(event, 'id')
  found(await prisma.salmSlot.findUnique({ where: { id }, select: { id: true } }))
  await prisma.salmSlot.delete({ where: { id } })
  return { success: true }
})
