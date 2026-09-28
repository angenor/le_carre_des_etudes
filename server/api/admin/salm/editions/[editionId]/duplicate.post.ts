import { defineEventHandler, setResponseStatus } from 'h3'
import { parseIdParam } from '../../../../../utils/salm-admin'
import { duplicateEdition } from '../../../../../utils/salm-lifecycle'

// Duplication vers l'année suivante, en brouillon (contrat § 8, FR-180).
export default defineEventHandler(async (event) => {
  const result = await duplicateEdition(parseIdParam(event, 'editionId'))
  setResponseStatus(event, 201)
  return result
})
