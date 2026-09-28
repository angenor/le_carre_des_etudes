import { defineEventHandler, readBody } from 'h3'
import { prisma } from '../../../../utils/prisma'
import { parseIdParam } from '../../../../utils/salm-admin'
import { asBody, assertValid, contentValidationError, found, isUniqueViolation, resortDays, validateDay } from '../../../../utils/salm-content'

// Modification d'un jour ; fermeture postérieure à l'ouverture sur les valeurs fusionnées (FR-150, FR-155).
export default defineEventHandler(async (event) => {
  const id = parseIdParam(event, 'id')
  const current = found(await prisma.salmDay.findUnique({
    where: { id },
    select: { editionId: true, date: true, opensAt: true, closesAt: true },
  }))
  const { data, errors } = validateDay(asBody(await readBody(event).catch(() => null)), { partial: true, current })
  assertValid(errors)
  if (data.date && data.date !== current.date) {
    const taken = await prisma.salmDay.findUnique({
      where: { editionId_date: { editionId: current.editionId, date: data.date } },
      select: { id: true },
    })
    if (taken) throw contentValidationError({ date: 'DUPLICATE' })
  }
  try {
    return await prisma.$transaction(async (tx) => {
      const day = await tx.salmDay.update({
        where: { id },
        data: { ...data, label: data.label ?? undefined },
        select: {
          id: true,
          date: true,
          label: true,
          opensAt: true,
          closesAt: true,
          slots: {
            orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
            select: { id: true, startTime: true, endTime: true, title: true, kind: true, description: true, isHighlighted: true },
          },
        },
      })
      await resortDays(tx, current.editionId)
      return day
    })
  }
  catch (err) {
    if (isUniqueViolation(err)) throw contentValidationError({ date: 'DUPLICATE' })
    throw err
  }
})
