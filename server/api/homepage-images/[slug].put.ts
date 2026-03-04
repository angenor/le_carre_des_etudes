import { defineEventHandler, readBody, createError, getRouterParam } from 'h3'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  if (!slug || !['hero_desktop', 'hero_mobile'].includes(slug)) {
    throw createError({
      statusCode: 400,
      message: 'Slug invalide. Valeurs acceptées : hero_desktop, hero_mobile.',
    })
  }

  const body = await readBody<{ imagePath: string }>(event)

  if (!body?.imagePath) {
    throw createError({
      statusCode: 400,
      message: 'Le champ "imagePath" est requis.',
    })
  }

  const updated = await prisma.homepageImage.update({
    where: { slug },
    data: { imagePath: body.imagePath },
  })

  return updated
})
