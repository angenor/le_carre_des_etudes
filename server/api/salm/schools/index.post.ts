import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { prisma } from '../../../utils/prisma'
import { assertRateLimit, getClientIp, SCHOOL_LIMIT } from '../../../utils/rate-limit'
import { getPublishedEdition, isRegistrationOpen } from '../../../utils/salm-edition'
import { apiError, assertHuman, pickSchoolFields, validateSchool } from '../../../utils/salm-registration'
import type { SalmSchoolResponse } from '#shared/types/salm'

// Inscription d'un établissement exposant (US3). Aucun badge, numéro ni jeton (FR-047).
export default defineEventHandler(async (event): Promise<SalmSchoolResponse> => {
  assertRateLimit(`schools:ip:${getClientIp(event)}`, SCHOOL_LIMIT, event)

  const fields = pickSchoolFields(await readBody(event).catch(() => null))
  assertHuman(event, fields)

  const edition = await getPublishedEdition()
  if (!edition) throw apiError(404, 'NO_EDITION')
  if (!isRegistrationOpen(edition, 'schools')) throw apiError(403, 'REGISTRATION_CLOSED')

  const standTypes = await prisma.salmStandType.findMany({
    where: { editionId: edition.id, isVisible: true },
    select: { id: true, name: true },
  })
  const data = validateSchool(fields, standTypes.map((s) => s.id))

  await prisma.salmSchoolRegistration.create({
    data: {
      editionId: edition.id,
      name: data.name,
      phone: data.phone,
      email: data.email,
      programmes: data.programmes,
      otherProgramme: data.otherProgramme,
      exhibitors: data.exhibitors,
      standTypeId: data.standTypeId,
      question: data.question,
      status: 'nouvelle',
    },
    select: { id: true },
  })

  setResponseStatus(event, 201)
  return {
    status: 'created',
    summary: {
      name: data.name,
      standName: standTypes.find((s) => s.id === data.standTypeId)!.name,
      exhibitorCount: data.exhibitors.length,
      programmes: data.programmes,
      otherProgramme: data.otherProgramme,
    },
  }
})
