import { defineEventHandler, readBody } from 'h3'
import { parseIdParam } from '../../../../../../utils/salm-admin'
import { applyOrder, asBody, requireEdition } from '../../../../../../utils/salm-content'

// Ordre des « Temps forts » d'une édition : liste complète des identifiants (FR-130, research R8).
export default defineEventHandler(async (event) => {
  const editionId = parseIdParam(event, 'editionId')
  await requireEdition(editionId)
  const body = asBody(await readBody(event).catch(() => null))
  return { ids: await applyOrder('salmHighlight', { editionId }, body.ids) }
})
