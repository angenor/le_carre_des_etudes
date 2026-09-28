import { defineEventHandler } from 'h3'
import { parseIdParam } from '../../../../../utils/salm-admin'
import { deleteDraftEdition } from '../../../../../utils/salm-lifecycle'

// Suppression d'un brouillon sans inscription (contrat § 5, FR-119).
export default defineEventHandler(async (event) => {
  await deleteDraftEdition(parseIdParam(event, 'editionId'))
  return { success: true }
})
