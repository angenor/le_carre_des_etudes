import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, message: 'ID invalide' })
  }

  const existing = await prisma.partner.findUnique({ where: { id } })
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Partenaire non trouvé' })
  }

  const body = await readBody(event)

  const partner = await prisma.partner.update({
    where: { id },
    data: {
      name: body.name?.trim() ?? existing.name,
      logoPath: body.logoPath?.trim() ?? existing.logoPath,
      url: body.url !== undefined ? (body.url?.trim() || null) : existing.url,
      order: body.order ?? existing.order,
    },
  })

  return partner
})
