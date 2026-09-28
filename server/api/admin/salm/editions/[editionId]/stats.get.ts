import { defineEventHandler, setHeader } from 'h3'
import { parseIdParam } from '../../../../../utils/salm-admin'
import { getEditionStats } from '../../../../../utils/salm-stats'

// Statistiques d'une édition et de son édition de comparaison (contrat § 10, FR-190 à FR-196).
export default defineEventHandler(async (event) => {
  const stats = await getEditionStats(parseIdParam(event, 'editionId'))
  setHeader(event, 'Cache-Control', 'private, no-store')
  return stats
})
