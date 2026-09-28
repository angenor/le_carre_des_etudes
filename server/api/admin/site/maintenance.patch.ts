import { createError, defineEventHandler, readBody } from 'h3'
import { setMaintenanceMode } from '../../../utils/site-settings'

// Active ou désactive le mode maintenance du site (route protégée par server/middleware/admin.ts).
export default defineEventHandler(async (event) => {
  const body = ((await readBody(event).catch(() => null)) ?? {}) as Record<string, unknown>
  if (typeof body.enabled !== 'boolean') {
    throw createError({ statusCode: 400, message: 'VALIDATION', data: { code: 'VALIDATION' } })
  }
  return { maintenance: await setMaintenanceMode(body.enabled) }
})
