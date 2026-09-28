import { defineEventHandler } from 'h3'
import { prisma } from '../../../../utils/prisma'
import { adminError, parseIdParam } from '../../../../utils/salm-admin'
import { found, resortDays } from '../../../../utils/salm-content'

// Suppression d'un jour et de ses créneaux ; une édition publiée garde au moins un jour (FR-151).
export default defineEventHandler(async (event) => {
  const id = parseIdParam(event, 'id')
  const day = found(await prisma.salmDay.findUnique({
    where: { id },
    select: {
      editionId: true,
      edition: { select: { status: true, _count: { select: { days: true } } } },
      _count: { select: { slots: true } },
    },
  }))
  if (day.edition.status === 'published' && day.edition._count.days <= 1) throw adminError(409, 'LAST_DAY_OF_PUBLISHED')
  await prisma.$transaction(async (tx) => {
    await tx.salmDay.delete({ where: { id } })
    await resortDays(tx, day.editionId)
  })
  return { success: true, deletedSlots: day._count.slots }
})
