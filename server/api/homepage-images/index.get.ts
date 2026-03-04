import { defineEventHandler } from 'h3'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async () => {
  const images = await prisma.homepageImage.findMany()

  // Retourner un objet indexé par slug pour un accès facile côté client
  const result: Record<string, string> = {}
  for (const img of images) {
    result[img.slug] = img.imagePath
  }
  return result
})
