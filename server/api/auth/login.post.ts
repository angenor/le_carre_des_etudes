import { defineEventHandler, readBody, createError, useSession } from 'h3'
import { sessionConfig } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body?.password) {
    throw createError({
      statusCode: 400,
      message: 'Mot de passe requis',
    })
  }

  const adminPassword = process.env.ADMIN_PASSWORD

  // En production, un mot de passe court ou resté à une valeur d'exemple publique vaut une absence
  const weakInProduction = process.env.NODE_ENV === 'production' && !!adminPassword
    && (adminPassword.length < 12 || ['admin-secret', 'changez-moi-en-production'].includes(adminPassword))

  if (!adminPassword || weakInProduction) {
    console.error('[auth] ADMIN_PASSWORD absent, trop court (12 caractères minimum) ou valeur d\'exemple : connexion admin refusée. Lancez ./deploy.sh update pour en générer un.')
    throw createError({
      statusCode: 500,
      message: 'Configuration serveur manquante',
    })
  }

  if (body.password !== adminPassword) {
    throw createError({
      statusCode: 401,
      message: 'Mot de passe incorrect',
    })
  }

  const session = await useSession(event, sessionConfig)

  await session.update({ admin: true })

  return { success: true }
})
