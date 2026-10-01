import { defineEventHandler, setHeader } from 'h3'
import { getKeyFigures } from '../../../../utils/salm-edition'

// Chiffres clés du SALM, toutes éditions confondues, pour le back-office.
export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  return { data: await getKeyFigures() }
})
