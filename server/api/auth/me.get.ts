import { defineEventHandler, useSession } from 'h3'
import { sessionConfig } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await useSession(event, sessionConfig)

  return { admin: !!session.data.admin }
})
