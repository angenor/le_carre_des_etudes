import { defineEventHandler, setHeader } from 'h3'
import { getSalmPartners } from '../../../../utils/salm-edition'

// Partenaires du SALM, toutes éditions confondues, pour le back-office.
export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  return { data: await getSalmPartners() }
})
