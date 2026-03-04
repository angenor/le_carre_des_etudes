import { defineEventHandler, getRequestURL, getMethod, useSession, createError } from 'h3'

const SESSION_SECRET = process.env.NUXT_SESSION_SECRET || 'dev-secret-at-least-32-characters-long!'

const PROTECTED_PREFIXES = ['/api/magazines', '/api/rubriques', '/api/partenaires']
const PROTECTED_METHODS = ['POST', 'PUT', 'DELETE']

// Routes protégées en lecture (GET) uniquement — les POST restent publics
const ADMIN_READ_PREFIXES = ['/api/stats/', '/api/downloads', '/api/newsletter']

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  const path = url.pathname
  const method = getMethod(event)

  // Routes /api/upload sont toujours protégées (toute méthode)
  const isUploadRoute = path.startsWith('/api/upload')

  // Routes magazines/rubriques/partenaires protégées uniquement en écriture
  const isProtectedWriteRoute =
    PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix)) &&
    PROTECTED_METHODS.includes(method)

  // Routes stats/downloads/newsletter : GET et DELETE protégés, POST public
  const isAdminReadRoute =
    ADMIN_READ_PREFIXES.some((prefix) => path.startsWith(prefix)) &&
    (method === 'GET' || method === 'DELETE')

  // Si la route ne nécessite pas d'authentification, laisser passer
  if (!isUploadRoute && !isProtectedWriteRoute && !isAdminReadRoute) {
    return
  }

  const session = await useSession(event, {
    password: SESSION_SECRET,
  })

  if (!session.data.admin) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Non autorisé',
      data: { message: 'Non autorisé' },
    })
  }
})
