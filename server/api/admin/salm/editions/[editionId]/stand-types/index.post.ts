import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { prisma } from '../../../../../../utils/prisma'
import { parseIdParam } from '../../../../../../utils/salm-admin'
import {
  asBody,
  assertValid,
  contentValidationError,
  isUniqueViolation,
  nextSortOrder,
  requireEdition,
  validateStandType,
} from '../../../../../../utils/salm-content'

// Ajout d'un type de stand, en fin de liste (FR-170).
export default defineEventHandler(async (event) => {
  const editionId = parseIdParam(event, 'editionId')
  await requireEdition(editionId)
  const otherNames = (await prisma.salmStandType.findMany({ where: { editionId }, select: { name: true } })).map((s) => s.name)
  const { data, errors } = validateStandType(asBody(await readBody(event).catch(() => null)), { otherNames })
  assertValid(errors)
  try {
    const stand = await prisma.salmStandType.create({
      data: {
        editionId,
        name: data.name!,
        description: data.description ?? null,
        priceLabel: data.priceLabel ?? null,
        isVisible: data.isVisible ?? true,
        sortOrder: await nextSortOrder('salmStandType', { editionId }),
      },
      select: { id: true, name: true, description: true, priceLabel: true, isVisible: true },
    })
    setResponseStatus(event, 201)
    return { ...stand, schoolCount: 0 }
  }
  catch (err) {
    if (isUniqueViolation(err)) throw contentValidationError({ name: 'DUPLICATE' })
    throw err
  }
})
