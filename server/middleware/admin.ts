import { defineEventHandler, getRequestURL, getMethod, useSession, createError } from 'h3'
import { sessionConfig } from '../utils/session'

const PROTECTED_PREFIXES = ['/api/magazines', '/api/rubriques', '/api/partenaires', '/api/homepage-images']
const PROTECTED_METHODS = ['POST', 'PUT', 'DELETE']

// Routes protégées en lecture (GET) uniquement — les POST restent publics
const ADMIN_READ_PREFIXES = ['/api/stats/', '/api/downloads', '/api/newsletter']

// Routes d'administration : toute méthode protégée (module SALM, research R13)
const ADMIN_ALL_METHODS_PREFIXES = ['/api/admin/']

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

  // Routes /api/admin/* : toute méthode protégée
  const isAdminAnyMethodRoute = ADMIN_ALL_METHODS_PREFIXES.some((prefix) => path.startsWith(prefix))

  // Si la route ne nécessite pas d'authentification, laisser passer
  if (!isUploadRoute && !isProtectedWriteRoute && !isAdminReadRoute && !isAdminAnyMethodRoute) {
    return
  }

  const session = await useSession(event, sessionConfig)

  if (!session.data.admin) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Non autorisé',
      data: { message: 'Non autorisé' },
    })
  }
})
