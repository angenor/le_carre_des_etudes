import { defineEventHandler, useSession } from 'h3'
import { sessionConfig } from '../../utils/session'

// Fin de la session admin côté serveur (le cookie de session devient invalide).
export default defineEventHandler(async (event) => {
  const session = await useSession(event, sessionConfig)
  await session.clear()
  return { success: true }
})
