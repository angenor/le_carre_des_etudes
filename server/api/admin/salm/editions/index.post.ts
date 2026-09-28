import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { prisma } from '../../../../utils/prisma'
import { assertValid, getEditionDetail, yearTaken, type ContentErrors } from '../../../../utils/salm-content'
import { isUniqueViolation } from '../../../../utils/salm-registration'
import { collapseSpaces } from '#shared/utils/salm'

// Création d'une édition en brouillon (contrat § 2, FR-111).
// Intitulé, organisateur et ville repris de l'édition d'année la plus élevée.
export default defineEventHandler(async (event) => {
  const body = ((await readBody(event).catch(() => null)) ?? {}) as Record<string, unknown>
  const errors: ContentErrors = {}

  const year = body.year
  if (year === undefined || year === null || year === '') errors.year = 'REQUIRED'
  else if (typeof year !== 'number' || !Number.isInteger(year) || year < 2020 || year > 2100) errors.year = 'INVALID_FORMAT'

  const latest = await prisma.salmEdition.findFirst({
    orderBy: { year: 'desc' },
    select: { salonName: true, organizerName: true, city: true },
  })
  const organizerRaw = typeof body.organizerName === 'string' ? collapseSpaces(body.organizerName) : ''
  if (!latest) {
    if (!organizerRaw) errors.organizerName = 'REQUIRED'
    else if (organizerRaw.length < 2) errors.organizerName = 'TOO_SHORT'
    else if (organizerRaw.length > 150) errors.organizerName = 'TOO_LONG'
  }
  assertValid(errors)

  const targetYear = year as number
  if (await prisma.salmEdition.findUnique({ where: { year: targetYear }, select: { id: true } })) throw yearTaken(targetYear)

  let created: { id: number }
  try {
    created = await prisma.salmEdition.create({
      data: {
        year: targetYear,
        status: 'draft',
        studentRegistrationOpen: false,
        schoolRegistrationOpen: false,
        ...(latest
          ? { salonName: latest.salonName, organizerName: latest.organizerName, city: latest.city }
          : { organizerName: organizerRaw }),
      },
      select: { id: true },
    })
  }
  catch (err) {
    if (isUniqueViolation(err)) throw yearTaken(targetYear)
    throw err
  }

  setResponseStatus(event, 201)
  return getEditionDetail(created.id)
})
