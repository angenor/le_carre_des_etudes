import { defineEventHandler, useSession } from 'h3'

const SESSION_SECRET = process.env.NUXT_SESSION_SECRET || 'dev-secret-at-least-32-characters-long!'

export default defineEventHandler(async (event) => {
  const session = await useSession(event, {
    password: SESSION_SECRET,
  })

  return { admin: !!session.data.admin }
})
