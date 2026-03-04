import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const path = body?.path
  if (!path || typeof path !== 'string' || !path.startsWith('/')) {
    throw createError({
      statusCode: 400,
      data: { message: 'Le chemin de la page est requis' },
    })
  }

  await prisma.pageVisit.create({
    data: { path },
  })

  event.node.res.statusCode = 201
  return { success: true }
})
