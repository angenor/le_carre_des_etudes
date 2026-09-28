import { defineEventHandler } from 'h3'
import { parseIdParam } from '../../../../../utils/salm-admin'
import { archiveEdition } from '../../../../../utils/salm-lifecycle'

// Archivage (contrat § 7, FR-117).
export default defineEventHandler((event) => archiveEdition(parseIdParam(event, 'editionId')))
