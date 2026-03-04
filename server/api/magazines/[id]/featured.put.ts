import { defineEventHandler, getRouterParam, createError } from 'h3'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, message: 'ID invalide' })
  }

  const existing = await prisma.magazine.findUnique({ where: { id } })
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Magazine introuvable' })
  }

  const magazine = await prisma.$transaction(async (tx) => {
    await tx.magazine.updateMany({
      where: { isFeatured: true },
      data: { isFeatured: false },
    })

    return tx.magazine.update({
      where: { id },
      data: { isFeatured: true },
    })
  })

  return magazine
})
