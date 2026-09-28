import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { prisma } from '../../../../../../utils/prisma'
import { parseIdParam } from '../../../../../../utils/salm-admin'
import {
  asBody,
  assertValid,
  contentValidationError,
  requireEdition,
  resortDays,
  validateDay,
} from '../../../../../../utils/salm-content'
import { isUniqueViolation } from '../../../../../../utils/salm-registration'

// Ajout d'un jour ; libellé « Jour N » par défaut, N étant la position par date (FR-150).
export default defineEventHandler(async (event) => {
  const editionId = parseIdParam(event, 'editionId')
  await requireEdition(editionId)
  const { data, errors } = validateDay(asBody(await readBody(event).catch(() => null)))
  assertValid(errors)
  const date = data.date!
  if (await prisma.salmDay.findUnique({ where: { editionId_date: { editionId, date } }, select: { id: true } })) {
    throw contentValidationError({ date: 'DUPLICATE' })
  }
  try {
    const day = await prisma.$transaction(async (tx) => {
      const before = await tx.salmDay.count({ where: { editionId, date: { lt: date } } })
      const created = await tx.salmDay.create({
        data: { editionId, date, label: data.label ?? `Jour ${before + 1}`, opensAt: data.opensAt!, closesAt: data.closesAt! },
        select: { id: true, date: true, label: true, opensAt: true, closesAt: true },
      })
      await resortDays(tx, editionId)
      return created
    })
    setResponseStatus(event, 201)
    return { ...day, slots: [] }
  }
  catch (err) {
    if (isUniqueViolation(err)) throw contentValidationError({ date: 'DUPLICATE' })
    throw err
  }
})
