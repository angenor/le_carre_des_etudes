import { defineEventHandler, readBody } from 'h3'
import { prisma } from '../../../../utils/prisma'
import { asBody, validateKeyFigures } from '../../../../utils/salm-content'
import { getKeyFigures } from '../../../../utils/salm-edition'

// Remplace toute la liste des chiffres clés du SALM, dans l'ordre reçu (fin de la page /salm).
export default defineEventHandler(async (event) => {
  const figures = validateKeyFigures(asBody(await readBody(event)))
  await prisma.$transaction([
    prisma.salmKeyFigure.deleteMany(),
    prisma.salmKeyFigure.createMany({ data: figures.map((f, i) => ({ ...f, sortOrder: i })) }),
  ])
  return { data: await getKeyFigures() }
})
