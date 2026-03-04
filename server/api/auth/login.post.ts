import { defineEventHandler, readBody, createError, useSession } from 'h3'

const SESSION_SECRET = process.env.NUXT_SESSION_SECRET || 'dev-secret-at-least-32-characters-long!'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body?.password) {
    throw createError({
      statusCode: 400,
      message: 'Mot de passe requis',
    })
  }

  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminPassword) {
    throw createError({
      statusCode: 500,
      message: 'Configuration serveur manquante',
    })
  }

  console.log('[LOGIN DEBUG] reçu:', JSON.stringify(body.password), 'attendu:', JSON.stringify(adminPassword))

  if (body.password !== adminPassword) {
    throw createError({
      statusCode: 401,
      message: 'Mot de passe incorrect',
    })
  }

  const session = await useSession(event, {
    password: SESSION_SECRET,
  })

  await session.update({ admin: true })

  return { success: true }
})
