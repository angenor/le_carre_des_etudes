import { defineEventHandler, readBody } from 'h3'
import { prisma } from '../../../../utils/prisma'
import { parseIdParam } from '../../../../utils/salm-admin'
import { asBody, assertValid, contentValidationError, found, validateStandType } from '../../../../utils/salm-content'
import { isUniqueViolation } from '../../../../utils/salm-registration'

// Modification d'un type de stand ; masquer ou réafficher = { isVisible } (FR-170, FR-171).
export default defineEventHandler(async (event) => {
  const id = parseIdParam(event, 'id')
  const { editionId } = found(await prisma.salmStandType.findUnique({ where: { id }, select: { editionId: true } }))
  const otherNames = (await prisma.salmStandType.findMany({ where: { editionId, id: { not: id } }, select: { name: true } }))
    .map((s) => s.name)
  const { data, errors } = validateStandType(asBody(await readBody(event).catch(() => null)), { partial: true, otherNames })
  assertValid(errors)
  try {
    const { _count, ...stand } = await prisma.salmStandType.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        description: true,
        priceLabel: true,
        isVisible: true,
        _count: { select: { schoolRegistrations: true } },
      },
    })
    return { ...stand, schoolCount: _count.schoolRegistrations }
  }
  catch (err) {
    if (isUniqueViolation(err)) throw contentValidationError({ name: 'DUPLICATE' })
    throw err
  }
})
