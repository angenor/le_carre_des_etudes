import { defineEventHandler } from 'h3'
import { adminError, parseIdParam } from '../../../../../utils/salm-admin'
import { getEditionDetail } from '../../../../../utils/salm-content'

// Fiche complète d'une édition pour les écrans du back-office (contrat § 3, FR-112).
export default defineEventHandler(async (event) => {
  const detail = await getEditionDetail(parseIdParam(event, 'editionId'))
  if (!detail) throw adminError(404, 'NOT_FOUND')
  return detail
})
