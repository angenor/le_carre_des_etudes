import { defineEventHandler, setHeader } from 'h3'
import { prisma } from '../../../../../utils/prisma'
import { adminError, parseIdParam } from '../../../../../utils/salm-admin'
import { loadEditionPayload } from '../../../../../utils/salm-edition'

// Données de l'aperçu : forme publique de GET /api/salm/edition, quel que soit le statut
// (contrat § 9, FR-100, FR-120, research R6).
export default defineEventHandler(async (event) => {
  const id = parseIdParam(event, 'editionId')
  if (!(await prisma.salmEdition.findUnique({ where: { id }, select: { id: true } }))) throw adminError(404, 'NOT_FOUND')
  setHeader(event, 'Cache-Control', 'private, no-store')
  return loadEditionPayload({ id })
})
