import { defineEventHandler, getRouterParam, setResponseStatus } from 'h3'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!id || isNaN(id)) {
    setResponseStatus(event, 404)
    return { message: 'Abonné non trouvé' }
  }

  const existing = await prisma.newsletterSubscriber.findUnique({ where: { id } })
  if (!existing) {
    setResponseStatus(event, 404)
    return { message: 'Abonné non trouvé' }
  }

  await prisma.newsletterSubscriber.delete({ where: { id } })

  return { success: true }
})
