import { defineEventHandler, readBody } from 'h3'
import { prisma } from '../../../../../utils/prisma'
import { isEditionEnded } from '../../../../../utils/salm-edition'
import { adminError, parseIdParam } from '../../../../../utils/salm-admin'

// Ouverture et fermeture séparées des inscriptions (FR-050, FR-053, FR-069).
export default defineEventHandler(async (event) => {
  const editionId = parseIdParam(event, 'editionId')
  const body = ((await readBody(event).catch(() => null)) ?? {}) as Record<string, unknown>

  const data: { studentRegistrationOpen?: boolean; schoolRegistrationOpen?: boolean } = {}
  if (typeof body.studentRegistrationOpen === 'boolean') data.studentRegistrationOpen = body.studentRegistrationOpen
  if (typeof body.schoolRegistrationOpen === 'boolean') data.schoolRegistrationOpen = body.schoolRegistrationOpen
  if (!Object.keys(data).length) throw adminError(400, 'VALIDATION')

  const edition = await prisma.salmEdition.findUnique({
    where: { id: editionId },
    select: { days: { select: { date: true, opensAt: true, closesAt: true } } },
  })
  if (!edition) throw adminError(404, 'NOT_FOUND', 'Édition introuvable.')

  // Ouvrir après la fin du salon est refusé ; fermer reste toujours possible
  const ended = isEditionEnded(edition.days)
  if (ended && (data.studentRegistrationOpen || data.schoolRegistrationOpen)) {
    throw adminError(409, 'EDITION_ENDED', 'Le salon est terminé : les inscriptions sont fermées automatiquement.')
  }

  const updated = await prisma.salmEdition.update({
    where: { id: editionId },
    data,
    select: { studentRegistrationOpen: true, schoolRegistrationOpen: true },
  })
  return { ...updated, ended }
})
