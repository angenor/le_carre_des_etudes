import { defineEventHandler, readBody } from 'h3'
import { prisma } from '../../../../utils/prisma'
import { asBody, validateSalmPartners } from '../../../../utils/salm-content'
import { getSalmPartners } from '../../../../utils/salm-edition'
import { releaseSalmFiles } from '../../../../utils/salm-files'

// Remplace toute la liste des partenaires du SALM, dans l'ordre reçu ; les logos qui ne servent plus sont supprimés.
export default defineEventHandler(async (event) => {
  const partners = await validateSalmPartners(asBody(await readBody(event)))
  const before = await prisma.salmPartner.findMany({ select: { logoPath: true } })
  await prisma.$transaction([
    prisma.salmPartner.deleteMany(),
    prisma.salmPartner.createMany({ data: partners.map((p, i) => ({ ...p, sortOrder: i })) }),
  ])
  await releaseSalmFiles(before.map((p) => p.logoPath))
  return { data: await getSalmPartners() }
})
