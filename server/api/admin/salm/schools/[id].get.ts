import { defineEventHandler } from 'h3'
import { adminError, getSchoolDetail, parseIdParam } from '../../../../utils/salm-admin'

// Fiche d'un établissement (FR-067).
export default defineEventHandler(async (event) => {
  const detail = await getSchoolDetail(parseIdParam(event, 'id'))
  if (!detail) throw adminError(404, 'NOT_FOUND', 'Inscription introuvable.')
  return detail
})
