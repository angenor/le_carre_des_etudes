import { defineEventHandler, readBody } from 'h3'
import { prisma } from '../../../../../utils/prisma'
import { adminError, parseIdParam } from '../../../../../utils/salm-admin'
import { purgeEditionPersonalData } from '../../../../../utils/salm-purge'

// Suppression des données personnelles d'une édition archivée, confirmée par l'année (FR-065b).
export default defineEventHandler(async (event) => {
  const editionId = parseIdParam(event, 'editionId')
  const body = ((await readBody(event).catch(() => null)) ?? {}) as Record<string, unknown>
  if (body.confirmYear === undefined || body.confirmYear === null || body.confirmYear === '') {
    throw adminError(400, 'VALIDATION')
  }

  const edition = await prisma.salmEdition.findUnique({ where: { id: editionId }, select: { year: true } })
  if (!edition) throw adminError(404, 'NOT_FOUND', 'Édition introuvable.')
  if (Number(body.confirmYear) !== edition.year) throw adminError(400, 'CONFIRMATION_MISMATCH')

  return purgeEditionPersonalData(editionId)
})
