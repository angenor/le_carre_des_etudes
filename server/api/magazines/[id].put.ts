import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { prisma } from '../../utils/prisma'
import { slugify } from '../../utils/slugify'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, message: 'ID invalide' })
  }

  const existing = await prisma.magazine.findUnique({ where: { id } })
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Magazine non trouvé' })
  }

  const body = await readBody(event)

  // Vérifier l'unicité de la version si elle change
  if (body.version && body.version.trim() !== existing.version) {
    const duplicate = await prisma.magazine.findUnique({
      where: { version: body.version.trim() },
    })
    if (duplicate) {
      throw createError({ statusCode: 400, message: 'Un magazine avec cette version existe déjà' })
    }
  }

  // Déterminer le slug
  let newSlug: string | undefined
  if (body.slug !== undefined) {
    newSlug = body.slug?.trim() ? slugify(body.slug.trim()) : undefined
  } else if (body.version && body.version.trim() !== existing.version) {
    newSlug = slugify(body.version.trim())
  }

  // Vérifier l'unicité du slug si changé
  if (newSlug && newSlug !== existing.slug) {
    const slugDuplicate = await prisma.magazine.findUnique({ where: { slug: newSlug } })
    if (slugDuplicate) {
      throw createError({ statusCode: 400, message: 'Un magazine avec ce slug existe déjà' })
    }
  }

  const magazine = await prisma.magazine.update({
    where: { id },
    data: {
      ...(body.name && { name: body.name.trim() }),
      ...(body.description && { description: body.description.trim() }),
      ...(body.version && { version: body.version.trim() }),
      ...(newSlug && { slug: newSlug }),
      ...(body.pdfPath && { pdfPath: body.pdfPath.trim() }),
      ...(body.coverImage !== undefined && { coverImage: body.coverImage?.trim() || null }),
      ...(body.coverImageOg !== undefined && { coverImageOg: body.coverImageOg?.trim() || null }),
      ...(body.publishedAt && { publishedAt: new Date(body.publishedAt) }),
      ...(body.subtitle !== undefined && { subtitle: body.subtitle?.trim() || null }),
      ...(body.availableAt !== undefined && { availableAt: body.availableAt ? new Date(body.availableAt) : null }),
    },
  })

  return magazine
})
