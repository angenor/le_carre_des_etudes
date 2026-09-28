import { defineEventHandler, setResponseHeader } from 'h3'
import { getControlContext, registrationPoster } from '../../../../utils/salm-control'
import type { SalmControlPoster } from '#shared/types/salm'

// Affiche d'inscription imprimable (FR-241) : adresse courte et QR code du formulaire public, même en mode essai.
export default defineEventHandler(async (event): Promise<SalmControlPoster> => {
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  const ctx = await getControlContext()
  return { year: ctx.edition.year, ...(await registrationPoster(event)) }
})
