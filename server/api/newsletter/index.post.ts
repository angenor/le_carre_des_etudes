import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { prisma } from '../../utils/prisma'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''

  if (!email || email.length > 254 || !EMAIL_REGEX.test(email)) {
    setResponseStatus(event, 400)
    return { message: 'Adresse email invalide' }
  }

  const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } })
  if (existing) {
    setResponseStatus(event, 409)
    return { message: 'Cette adresse email est déjà inscrite à notre newsletter.' }
  }

  await prisma.newsletterSubscriber.create({ data: { email } })

  setResponseStatus(event, 201)
  return { success: true, message: 'Inscription réussie ! Vous recevrez nos prochaines éditions.' }
})
