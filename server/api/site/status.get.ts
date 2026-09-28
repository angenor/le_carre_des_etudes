import { defineEventHandler, useSession } from 'h3'
import { sessionConfig } from '../../utils/session'
import { isMaintenanceMode } from '../../utils/site-settings'

// État du site pour le client : maintenance et session admin (aperçu du site pendant la maintenance).
export default defineEventHandler(async (event) => {
  const session = await useSession(event, sessionConfig)
  return { maintenance: await isMaintenanceMode(), admin: !!session.data.admin }
})
