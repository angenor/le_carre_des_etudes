import { defineEventHandler } from 'h3'
import { parseIdParam } from '../../../../../utils/salm-admin'
import { publishEdition } from '../../../../../utils/salm-lifecycle'

// Publication, avec archivage de l'édition publiée (contrat § 6, FR-115, FR-115a, FR-116).
export default defineEventHandler((event) => publishEdition(parseIdParam(event, 'editionId')))
