import { defineEventHandler, getRouterParam, createError } from 'h3'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  if (!slug?.trim()) {
    throw createError({ statusCode: 400, message: 'Slug requis' })
  }

  const magazine = await prisma.magazine.findUnique({
    where: { slug: slug.trim() },
  })

  if (!magazine) {
    throw createError({ statusCode: 404, message: 'Magazine non trouvé' })
  }

  return magazine
})
