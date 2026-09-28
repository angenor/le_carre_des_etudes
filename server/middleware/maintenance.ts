import { defineEventHandler, getRequestURL, sendRedirect, setResponseHeader, useSession, createError } from 'h3'
import { sessionConfig } from '../utils/session'
import { isMaintenanceMode } from '../utils/site-settings'

// Mode maintenance du site entier : les visiteurs sont renvoyés vers /maintenance (503),
// les administrateurs connectés voient le site normalement.

// Toujours accessibles : back-office, connexion, statut, fichiers statiques et ressources Nuxt
const ALWAYS_ALLOWED = [
  '/admin',
  '/api/admin/',
  '/api/auth/',
  '/api/site/status',
  '/maintenance',
  '/_',
  '/fonts/',
  '/images/',
  '/uploads/',
  '/favicon',
  '/robots.txt',
]

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname
  if (ALWAYS_ALLOWED.some((prefix) => path.startsWith(prefix))) return
  if (!(await isMaintenanceMode())) return

  const session = await useSession(event, sessionConfig)
  if (session.data.admin) return

  setResponseHeader(event, 'Retry-After', 3600)
  if (path.startsWith('/api/')) {
    throw createError({ statusCode: 503, message: 'MAINTENANCE', data: { code: 'MAINTENANCE' } })
  }
  return sendRedirect(event, '/maintenance', 302)
})
