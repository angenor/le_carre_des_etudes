import { defineEventHandler, setResponseHeader } from 'h3'
import { buildSnapshot, getControlContext } from '../../../../utils/salm-control'
import type { SalmControlSnapshot } from '#shared/types/salm'

// Précharge du poste de contrôle (FR-232) : badges hachés, entrées et compteurs de l'édition publiée.
export default defineEventHandler(async (event): Promise<SalmControlSnapshot> => {
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  return buildSnapshot(event, await getControlContext())
})
