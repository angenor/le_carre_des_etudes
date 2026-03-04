import { defineEventHandler, readBody, createError, getCookie, setCookie, getHeader } from 'h3'
import { prisma } from '../../utils/prisma'
import { isBot } from '../../utils/is-bot'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const path = body?.path
  if (!path || typeof path !== 'string' || !path.startsWith('/')) {
    throw createError({
      statusCode: 400,
      data: { message: 'Le chemin de la page est requis' },
    })
  }

  // Exclusion des pages admin
  if (path.startsWith('/admin')) {
    return { success: true, skipped: 'admin' }
  }

  // Filtre bots
  const userAgent = getHeader(event, 'user-agent')
  if (isBot(userAgent)) {
    return { success: true, skipped: 'bot' }
  }

  // Cookie visiteur
  let visitorId = getCookie(event, 'visitor_id')
  if (!visitorId) {
    visitorId = crypto.randomUUID()
    setCookie(event, 'visitor_id', visitorId, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 365, // 1 an
      sameSite: 'lax',
      path: '/',
    })
  }

  // Dedup 5 min (même visiteur + même page)
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)
  const recent = await prisma.pageVisit.findFirst({
    where: {
      visitorId,
      path,
      visitedAt: { gte: fiveMinAgo },
    },
  })

  if (recent) {
    return { success: true, skipped: 'dedup' }
  }

  await prisma.pageVisit.create({
    data: { path, visitorId },
  })

  event.node.res.statusCode = 201
  return { success: true }
})
