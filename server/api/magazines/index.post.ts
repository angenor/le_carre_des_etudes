import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body?.name?.trim()) {
    throw createError({ statusCode: 400, message: 'Le nom est requis' })
  }
  if (!body?.description?.trim()) {
    throw createError({ statusCode: 400, message: 'La description est requise' })
  }
  if (!body?.version?.trim()) {
    throw createError({ statusCode: 400, message: 'La version est requise' })
  }
  if (!body?.pdfPath?.trim()) {
    throw createError({ statusCode: 400, message: 'Le fichier PDF est requis' })
  }
  if (!body?.publishedAt) {
    throw createError({ statusCode: 400, message: 'La date de publication est requise' })
  }

  const existing = await prisma.magazine.findUnique({
    where: { version: body.version.trim() },
  })
  if (existing) {
    throw createError({ statusCode: 400, message: 'Un magazine avec cette version existe déjà' })
  }

  const magazine = await prisma.magazine.create({
    data: {
      name: body.name.trim(),
      description: body.description.trim(),
      version: body.version.trim(),
      pdfPath: body.pdfPath.trim(),
      coverImage: body.coverImage?.trim() || null,
      publishedAt: new Date(body.publishedAt),
    },
  })

  setResponseStatus(event, 201)
  return magazine
})
