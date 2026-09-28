import { defineEventHandler } from 'h3'
import { prisma } from '../../utils/prisma'
import type { SalmStatus } from '#shared/types/salm'

// Donnée légère pour la navbar et le pied de page (FR-018).
export default defineEventHandler(async (): Promise<SalmStatus> => {
  const edition = await prisma.salmEdition.findFirst({
    where: { status: 'published' },
    orderBy: { year: 'desc' },
    select: { year: true },
  })
  return { published: !!edition, year: edition?.year ?? null }
})
