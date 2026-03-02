import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.name?.trim()) {
    throw createError({ statusCode: 400, message: 'Le nom est requis' })
  }
  if (!body.logoPath?.trim()) {
    throw createError({ statusCode: 400, message: 'Le chemin du logo est requis' })
  }

  const partner = await prisma.partner.create({
    data: {
      name: body.name.trim(),
      logoPath: body.logoPath.trim(),
      url: body.url?.trim() || null,
      order: body.order ?? 0,
    },
  })

  return partner
})
